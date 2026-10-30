// Real YouCam API client — SERVER ONLY. Never import this from a client
// component: it reads YOUCAM_API_KEY, which must never reach the browser
// (API-RESEARCH.md §1.3, Risk R7).
//
// Implements the documented V2 async flow (API-RESEARCH.md §2):
//   1. POST /s2s/v2.0/file/<feature>        → file_id + pre-signed upload URL
//   2. PUT raw bytes to the pre-signed URL  (skipping this = 500/404 later)
//   3. POST /s2s/v2.0/task/<feature>        → task_id
//   4. GET  /s2s/v2.0/task/<feature>/<id>   → poll every ~2.5s, 55s cap
// Auth: Authorization: Bearer <YOUCAM_API_KEY> on every API call.
// Units are consumed only on task success — errors are free (§2, §4).

import { PANEL } from './concerns';
import { friendlyError } from './concerns';
import type {
  ConcernScore,
  SkinAnalysisResult,
  SkinProvider,
  TryOnRequest,
  TryOnResult,
} from './types';

const BASE = 'https://yce-api-01.makeupar.com';
const POLL_INTERVAL_MS = 2500;
const POLL_TIMEOUT_MS = 55_000; // stay inside serverless route limits (R6)

export class YouCamError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

function apiKey(): string {
  const key = process.env.YOUCAM_API_KEY;
  if (!key) throw new YouCamError('YOUCAM_API_KEY is not set', 'MissingApiKey');
  return key;
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const json: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code =
      json?.error?.code ?? json?.error_code ?? json?.data?.error_code;
    throw new YouCamError(
      friendlyError(code, `YouCam API error (HTTP ${res.status})`),
      code,
    );
  }
  return json;
}

/** Step 1+2: register the file, then PUT the raw bytes to the signed URL. */
async function uploadFile(
  feature: 'skin-analysis' | 'makeup-vto',
  image: Buffer,
  contentType: string,
): Promise<string> {
  const fileName = feature === 'skin-analysis' ? 'selfie.jpg' : 'tryon.jpg';
  const created = await apiFetch(`/s2s/v2.0/file/${feature}`, {
    method: 'POST',
    body: JSON.stringify({
      // file_size is REQUIRED by the real API (verified live 2026-10-28:
      // omitting it returns HTTP 400 InvalidParameters).
      files: [
        { content_type: contentType, file_name: fileName, file_size: image.length },
      ],
    }),
  });
  const data = created?.data ?? created;
  const fileId: string | undefined = data?.file_id ?? data?.files?.[0]?.file_id;
  const uploadUrl: string | undefined =
    data?.files?.[0]?.requests?.[0]?.url ??
    data?.requests?.[0]?.url ??
    data?.files?.[0]?.url ??
    data?.upload_url;
  if (!fileId || !uploadUrl) {
    throw new YouCamError('Upload step returned no file_id / signed URL');
  }
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: new Uint8Array(image),
  });
  if (!put.ok) throw new YouCamError(`Signed-URL upload failed (HTTP ${put.status})`);
  return fileId;
}

async function createTask(feature: string, body: unknown): Promise<string> {
  const created = await apiFetch(`/s2s/v2.0/task/${feature}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const taskId = created?.data?.task_id ?? created?.task_id;
  if (!taskId) throw new YouCamError('Task creation returned no task_id');
  return taskId;
}

async function pollTask(feature: string, taskId: string): Promise<any> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const res = await apiFetch(`/s2s/v2.0/task/${feature}/${taskId}`);
    const data = res?.data ?? res;
    const status: string = data?.task_status ?? data?.status;
    if (status === 'success') return data;
    if (status === 'error' || status === 'failed') {
      const code = data?.error?.code ?? data?.error_code;
      throw new YouCamError(
        friendlyError(code, 'The analysis could not be completed — please retake your photo.'),
        code,
      );
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new YouCamError('Analysis timed out — please try again.');
}

async function fetchAsDataUrl(url: string): Promise<string> {
  // Result/mask URLs expire (~2h) — download immediately and re-serve as
  // data (API-RESEARCH.md §2, Risk R4).
  const res = await fetch(url);
  if (!res.ok) throw new YouCamError(`Result download failed (HTTP ${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  // S3 result URLs can come back as binary/octet-stream (and the bytes
  // may be PNG even under a .jpg URL) — sniff the magic bytes instead.
  let ct = res.headers.get('content-type') ?? '';
  if (!ct.startsWith('image/')) {
    if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50) ct = 'image/png';
    else if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8) ct = 'image/jpeg';
    else if (
      buf.length > 12 &&
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    )
      ct = 'image/webp';
    else ct = 'image/jpeg';
  }
  return `data:${ct};base64,${buf.toString('base64')}`;
}

export const youcamProvider: SkinProvider = {
  async analyzeSkin(image: Buffer, contentType: string): Promise<SkinAnalysisResult> {
    const fileId = await uploadFile('skin-analysis', image, contentType);
    const taskId = await createTask('skin-analysis', {
      src_file_id: fileId,
      dst_actions: PANEL, // 7 SD concerns — never mix SD/HD (§3.2)
      miniserver_args: { enable_mask_overlay: true },
      format: 'json',
    });
    const data = await pollTask('skin-analysis', taskId);

    // Real response shape, verified live 2026-10-28 against
    // fixtures/sample-score-info.json: data.results.output[] holds one
    // entry per dst_action keyed by `type` (ui_score / raw_score /
    // mask_urls), plus type:'all' and type:'skin_age' entries whose
    // value sits in a string `score` field. Older defensive fallbacks
    // are kept for the other documented shapes.
    const result = data?.result ?? data?.results ?? data;
    const scoreList: any[] =
      result?.output ?? result?.score_info ?? result?.scores ?? result?.dst_results ?? [];
    const byAction = new Map<string, any>();
    for (const entry of scoreList) {
      const action = entry?.type ?? entry?.action ?? entry?.dst_action ?? entry?.name;
      if (action) byAction.set(action, entry);
    }
    const concerns: ConcernScore[] = (
      await Promise.all(
        PANEL.map(async (id) => {
          const e = byAction.get(id) ?? {};
          const ui = Math.round(e.ui_score ?? e.score ?? 0);
          const maskSrc: string | undefined = e.mask_url ?? e.mask_urls?.[0];
          // Mask URLs are signed and expire (~2h) — re-serve as data URLs.
          const maskUrl = maskSrc
            ? await fetchAsDataUrl(maskSrc).catch(() => undefined)
            : undefined;
          return {
            id,
            uiScore: ui,
            rawScore: Math.round(e.raw_score ?? ui),
            maskUrl,
          };
        }),
      )
    ).filter((c) => c.uiScore > 0);

    let overlayUrl: string | undefined;
    const overlaySrc =
      result?.mask_overlay_url ?? result?.overlay_url ?? data?.mask_overlay_url;
    if (overlaySrc) {
      overlayUrl = await fetchAsDataUrl(overlaySrc).catch(() => undefined);
    }

    const overallEntry = byAction.get('all');
    const skinAgeEntry = byAction.get('skin_age');
    return {
      overall: Math.round(
        Number(overallEntry?.score ?? result?.all ?? result?.overall_score ?? 0),
      ),
      skinAge: Math.round(Number(skinAgeEntry?.score ?? result?.skin_age ?? 0)),
      concerns,
      mode: 'live',
      overlayUrl,
    };
  },

  async tryOnMakeup(
    image: Buffer,
    contentType: string,
    req: TryOnRequest,
  ): Promise<TryOnResult> {
    const fileId = await uploadFile('makeup-vto', image, contentType);
    // One effect per call, so a failure in one shade never blocks another (§4).
    const effect =
      req.kind === 'foundation'
        ? {
            category: 'foundation',
            palettes: [
              {
                color: req.color,
                colorIntensity: req.colorIntensity,
                glowIntensity: req.glowIntensity ?? 30,
                coverageIntensity: req.coverageIntensity ?? 60,
              },
            ],
          }
        : {
            category: 'lip_color',
            shape: { name: 'original' }, // never reshape the user's lips (§4.2)
            style: { type: 'full' },
            palettes: [
              {
                color: req.color,
                texture: req.texture ?? 'matte', // matte/satin only — no conditional fields
                colorIntensity: req.colorIntensity,
              },
            ],
          };
    const taskId = await createTask('makeup-vto', {
      src_file_id: fileId,
      version: '1.0',
      effects: [effect],
    });
    const data = await pollTask('makeup-vto', taskId);
    // Real shape verified live 2026-10-28 (fixtures/sample-vto-result.json):
    // data.results.url is the result image URL string.
    const resultUrl: string | undefined =
      data?.results?.url ??
      data?.result_url ??
      data?.results?.[0]?.url ??
      data?.download_url;
    if (!resultUrl) throw new YouCamError('Try-on finished without a result image');
    return {
      resultImage: await fetchAsDataUrl(resultUrl),
      mode: 'live',
      simulated: false,
    };
  },
};
