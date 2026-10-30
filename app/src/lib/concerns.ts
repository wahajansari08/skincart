import type { ConcernId } from './types';

// The SkinCart panel: 7 SD concerns (API-RESEARCH.md §3.2–3.3). SD only —
// SD and HD dst_actions cannot be mixed in one request.
export const PANEL: ConcernId[] = [
  'wrinkle',
  'pore',
  'acne',
  'moisture',
  'redness',
  'age_spot',
  'dark_circle_v2',
];

export interface ConcernMeta {
  id: ConcernId;
  label: string;
  short: string;
  /** Plain-English explanation, chosen by score band. Written for shoppers, not dermatologists. */
  explain: (uiScore: number) => string;
  band: (uiScore: number) => 'Strong' | 'Fair' | 'Needs care';
}

function bandOf(score: number): 'Strong' | 'Fair' | 'Needs care' {
  if (score >= 75) return 'Strong';
  if (score >= 55) return 'Fair';
  return 'Needs care';
}

export const CONCERNS: Record<ConcernId, ConcernMeta> = {
  wrinkle: {
    id: 'wrinkle',
    label: 'Fine Lines & Wrinkles',
    short: 'Fine lines',
    band: bandOf,
    explain: (s) =>
      s >= 75
        ? 'Expression lines are faint — your skin is holding its smoothness well.'
        : s >= 55
          ? 'Early fine lines are showing, mostly where your face moves most.'
          : 'Fine lines are clearly visible in the overlay — this is where a targeted night treatment earns its keep.',
  },
  pore: {
    id: 'pore',
    label: 'Pores',
    short: 'Pores',
    band: bandOf,
    explain: (s) =>
      s >= 75
        ? 'Pores look refined and barely visible.'
        : s >= 55
          ? 'Pores are slightly enlarged around the nose and cheeks.'
          : 'Enlarged pores are concentrated on the nose and cheeks — oil regulation is the fix, not scrubbing.',
  },
  acne: {
    id: 'acne',
    label: 'Blemishes & Acne',
    short: 'Blemishes',
    band: bandOf,
    explain: (s) =>
      s >= 75
        ? 'Skin looks clear, with very few active blemishes detected.'
        : s >= 55
          ? 'A few blemishes and clogged spots were detected.'
          : 'Active blemishes were detected across the T-zone — a gentle BHA routine targets them without stripping your skin.',
  },
  moisture: {
    id: 'moisture',
    label: 'Hydration & Moisture',
    short: 'Hydration',
    band: bandOf,
    explain: (s) =>
      s >= 75
        ? 'Hydration looks healthy — skin reads plump and comfortable.'
        : s >= 55
          ? 'Hydration is a little low in patches — skin may feel tight after cleansing.'
          : 'Skin is reading dehydrated. Water-binding hydration, layered under moisturizer, is the fastest visible win.',
  },
  redness: {
    id: 'redness',
    label: 'Redness',
    short: 'Redness',
    band: bandOf,
    explain: (s) =>
      s >= 75
        ? 'Tone looks calm and even, with little visible redness.'
        : s >= 55
          ? 'Some redness shows across the cheeks and around the nose.'
          : 'Redness is pronounced, mostly across the cheeks — a barrier-first, calming routine will help it settle.',
  },
  age_spot: {
    id: 'age_spot',
    label: 'Dark Spots & Pigmentation',
    short: 'Dark spots',
    band: bandOf,
    explain: (s) =>
      s >= 75
        ? 'Pigmentation looks even — no significant spotting detected.'
        : s >= 55
          ? 'A few pigmentation spots are visible in the overlay.'
          : 'Pigmentation spots showed up clearly in your overlay — a brightening step plus daily SPF is the standard pairing.',
  },
  dark_circle_v2: {
    id: 'dark_circle_v2',
    label: 'Dark Circles',
    short: 'Dark circles',
    band: bandOf,
    explain: (s) =>
      s >= 75
        ? 'The under-eye area looks bright and rested.'
        : s >= 55
          ? 'Mild shadowing under the eyes — the classic tired look.'
          : 'Dark circles were detected under both eyes — targeted eye care brightens the whole face fastest.',
  },
};

/** Friendly retake messages for live-API photo errors (API-RESEARCH.md §3.5). */
export const FRIENDLY_ERRORS: Record<string, string> = {
  error_src_face_too_small: 'Move closer — your face should fill most of the frame.',
  error_lighting_dark: 'Too dark — face a window or a bright light and retake.',
  error_no_face: 'No face detected — use a clear, front-facing selfie.',
  error_face_position_too_small: 'Face too small — move closer to the camera.',
  error_face_position_invalid: 'Make sure your whole face is visible in the frame.',
  error_face_position_out_of_boundary: 'Your face is partly outside the frame — center it and retake.',
  CreditInsufficiency: 'Demo API units are used up — showing demo data instead.',
  InvalidApiKey: 'The demo API key needs attention — showing demo data instead.',
};

export function friendlyError(code: string | undefined, fallback: string): string {
  if (code && FRIENDLY_ERRORS[code]) return FRIENDLY_ERRORS[code];
  return fallback;
}
