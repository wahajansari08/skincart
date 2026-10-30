# SkinCart — Status

Last updated: 2026-10-28 (Day 2 of the build plan). Hackathon deadline: **Nov 2, 2026, 11:45am ET** · Submit target: **Nov 1**.

## Run it

```bash
cd ~/workspace/contest-platforms/skincart/app
npm install        # already done in this environment
npm run dev        # dev server → http://localhost:3000
# or production:
npm run build && npm run start
```

No environment variables are needed for mock mode. For live mode, copy `.env.example` to `.env.local` and set `YOUCAM_API_KEY` (never commit it — `.env*` is git-ignored).

## Stack choice

**Next.js 15 (App Router) + TypeScript + Tailwind CSS v4** — exactly the stack in BUILD-CHECKLIST.md, and the environment supports it cleanly (Node 24, build verified). One deviation from the checklist's file plan, made deliberately: the results dashboard and try-on panel live on the single home page as step views (`upload → processing → results`) instead of separate `/results` and `/try-on` routes — this keeps the selfie + analysis state in memory (no server-side face storage, matching the privacy design) and makes the demo flow one continuous story. All checklist components exist with the planned responsibilities.

## ✅ What works now (verified 2026-10-28)

- **Full mock flow end-to-end**, verified against the production build over HTTP:
  - Landing page + hero with the two-API story, 4-step explainer, privacy note.
  - **Upload**: drag/drop or browse, photo-rules checklist (face 60–80%, lighting, forehead, glasses), client-side resize to ≤1600px long side (satisfies both APIs per API-RESEARCH §4.5).
  - **Sample photo option**: an original illustrated portrait (`public/sample-face.svg`, no real person's photo) runs the whole flow — the judges' always-working path (Risk R5).
  - **Processing state**: animated step-by-step progress over the user's own photo.
  - **Results dashboard**: overall score + estimated skin age header, all 7 SD concern cards (`ui_score`, band, animated bar, plain-English explanation), weakest-3 highlighted; mask-overlay toggle appears when the live API returns an overlay.
  - **Recommendations**: the 3 lowest-scoring concerns map to 3 curated products (generic names, no brand trademarks), each with a reason quoting the user's actual score; "Complete the routine" row shows the rest of the 10-product catalog.
  - **Virtual try-on panel**: foundation + lipstick product cards, 3 shades each, shade picker → mock VTO → **before/after drag slider** with an honest "Simulated preview" label in mock mode.
- **Mock provider** (`src/lib/mock.ts`): deterministic scores derived from a hash of the photo — the same photo always returns the same analysis (verified), different photos give different dashboards, so recommendations visibly react per face.
- **Provider architecture** (`src/lib/provider.ts` + `src/lib/types.ts`): mock and real providers implement the same `SkinProvider` interface (`analyzeSkin`, `tryOnMakeup`). Selection is automatic: live when `YOUCAM_API_KEY` is set and `SKINCART_MOCK` isn't `1`.
- **Live-failure insurance**: if live mode is on and a YouCam call fails, the API routes serve mock data with a `fallback` flag → the UI shows a "Demo data" badge instead of dead-ending.
- **Build verified**: `npm run build` compiles clean (type-check included); smoke tests of `/`, `/api/analyze`, `/api/try-on`, and the sample asset all passed.

## 🔌 Real API adapter — KEY LANDED, LIVE VERIFIED 2026-10-28

`src/lib/youcam.ts` implements the documented V2 flow from API-RESEARCH.md: Bearer-key auth, file upload → **PUT bytes to the pre-signed URL** → create task (7 SD `dst_actions`, `enable_mask_overlay`, `format: json`) → poll every 2.5s with a 55s cap; makeup-vto with one effect per call (foundation palette; lipstick `lip_color` / shape `original` / `full` / matte). Result and mask URLs are downloaded immediately and re-served as data URLs (they expire in ~2h). Photo errors map to the friendly retake messages in `src/lib/concerns.ts`.

**Live verification (2026-10-28, full detail in `test-log.md`):** the key ("SkinCart", expires 2026-12-27; 1,000 units to 2027-01-26) is in `.env.local`. Skin analysis AND both VTO effects (foundation, lipstick) ran end-to-end through the app's own /api routes in live mode — overall 71 / skinAge 44 matching the raw fixture. The live test caught and fixed 5 adapter bugs the docs never mentioned: required `file_size` in file-create, signed-URL at `files[0].requests[0].url`, skin results under `results.output[]` keyed by `type` with `all`/`skin_age` in a string `score` field, VTO result at `results.url`, and PNG-bytes/octet-stream content types on result downloads (now magic-byte sniffed). Real responses saved as `app/fixtures/sample-score-info.json` + `sample-vto-result.json`. Test spend ≈ under 60 of 1,000 units.

## ⏳ What remains

- [x] **YouCam API key** — redeemed (1,000 units) and created 2026-10-28; in `.env.local`. Still needs adding to the Vercel env at deploy time.
- [x] Live integration test — done 2026-10-28 with a generated fictional-person test photo (`test-photos/`); see `test-log.md`. (A 3-photo set was unnecessary — one photo exercised every path; more photos only if demo prep wants them.)
- [ ] Vercel production deploy with `YOUCAM_API_KEY` set; cold test of the hosted URL on a phone. (Needs a Vercel account sign-in — Wahaj/Be step.)
- [ ] Capture one real VTO output for the mock fixture set (polish only — mock already labels its preview as simulated).
- [x] Screenshots refreshed from the LIVE build 2026-10-28 (submission/screenshots 01–05, captured by driving the production build locally with Playwright): dashboard shows real live scores (overall 71, skin age 44, real mask overlays, no Demo badge) and the try-on shot shows the real before/after slider with the "Rendered by YouCam Makeup VTO" badge. Recapturing from the production URL after deploy is optional polish — the app is identical.
- [x] Demo video PRODUCED 2026-10-28: `submission/demo-video.mp4` — 1:43, 1920x1080, recorded from the live build (real photo → live analysis → matched products → foundation + lipstick VTO with slider drags), narrated (7 scripted lines), captions burned in + sidecar `submission/video/captions.srt`, title/end cards. Still needed: YouTube public upload + URL into the Devpost form.
- [x] Git repo init + README + key-leak grep — done 2026-10-28: repo initialized at the skincart/ root, 2 commits, staged-content leak scan CLEAN (no key, no signed URLs; fixtures git-ignored). Root README corrected (the old "redeem code rejected / demo provider" note was replaced with the verified-live status). GitHub push PENDING on App access: the Muse GitHub App cannot create repositories (403), so Wahaj created the empty public repo `skincart` himself on 2026-10-28 — but the first push still failed at initialization with the same 403, because the App's installation does not yet include the new repo in its repository selection. Wahaj/Be must add `skincart` via the App installation ("Select repositories" link sent in chat 2026-10-28). The repo is confirmed still empty (nothing partial was written). Once access lands, the prepared 37-file text snapshot (216 KB, all UTF-8; screenshots/test photo are binary and stay out of the snapshot — they go in the Devpost gallery) pushes in one commit, followed by read-back verification and the sync record.
- [ ] Devpost submission on **Nov 1** using the field checklist in BUILD-CHECKLIST.md. **Nothing has been submitted yet.**

## File map

```
app/
  src/app/page.tsx            → single-page flow: hero+upload → processing → results (dashboard, recs, try-on)
  src/app/api/analyze/        → POST selfie → provider → scores JSON (live→mock fallback)
  src/app/api/try-on/         → POST selfie + shade spec → provider → result image
  src/lib/types.ts            → SkinProvider interface + shared result shapes
  src/lib/provider.ts         → live/mock selection
  src/lib/youcam.ts           → real YouCam V2 client (server-only, key from env)
  src/lib/mock.ts             → mock provider (deterministic, hash-derived)
  src/lib/concerns.ts         → 7-concern panel metadata + plain-English copy + friendly errors
  src/lib/products.ts         → 10-product catalog + concern→product mapping + shade data
  src/components/             → UploadDropzone, ProcessingState, ScoreCard,
                                RecommendationCard, ShadePreview, ProductArt
  public/sample-face.svg      → original illustrated sample portrait
  .env.example                → YOUCAM_API_KEY / SKINCART_MOCK (no real values)
```
