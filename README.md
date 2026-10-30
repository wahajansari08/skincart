# SkinCart

**One selfie → AI skin scores → matched products → try the shade on your own face.**

SkinCart is a beauty-eCommerce demo built for the **YouCam API Skin AI & eCommerce VTO Hackathon** (Devpost, Skin AI category) by **Wahaj Ansari** (solo). It chains **two YouCam APIs** into one shopping flow:

1. **YouCam Skin Analysis API** *diagnoses* — upload a selfie and get scores for 7 skin concerns (fine lines & wrinkles, pores, blemishes & acne, hydration & moisture, redness, dark spots & pigmentation, dark circles), an overall score, and an estimated skin age.
2. A recommendation engine matches your **3 weakest scores** to 3 curated products, each with a reason that quotes your actual score.
3. **YouCam Makeup Virtual Try-On API** *previews* — try foundation and lipstick shades on your own photo with a before/after slider before you buy.

Your photo is processed for analysis and **never stored**: no accounts, no database, no server-side face storage.

## Screenshots

| View | Capture |
|---|---|
| Landing + guided upload | `submission/screenshots/01-home-upload.png` |
| Processing (analysis in progress) | `submission/screenshots/02-processing.png` |
| Results dashboard (sample portrait) | `submission/screenshots/03-results-dashboard.png` |
| Recommendations | `submission/screenshots/04-recommendations.png` |
| Virtual try-on (before/after slider) | `submission/screenshots/05-try-on.png` |

*(The five screenshots are attached in the Devpost project gallery; the same captures are kept in `submission/screenshots/` in the project archive.)*

## Quick start

```bash
cd app
npm install
npm run dev        # → http://localhost:3000
```

That's it — with no environment variables, SkinCart runs in **demo (mock) mode**: the full flow works end-to-end (upload → analysis → dashboard → recommendations → try-on) on realistic simulated data. You can upload your own selfie or use the one-click **sample portrait**.

Production build:

```bash
cd app
npm run build
npm run start
```

**Requirements:** Node.js 18.18+ (developed on Node 24), npm.

## Enable the real YouCam API

SkinCart's live integration is complete — it is activated purely by configuration:

1. Get a YouCam API key from the API console:
   https://yce.makeupar.com/api-console/en/api-keys/
2. Copy the example env file and paste your key in:

   ```bash
   cp app/.env.example app/.env.local
   # then edit .env.local:
   #   YOUCAM_API_KEY=<your key>
   ```

3. Restart the app. With a key present (and `SKINCART_MOCK` unset), the server routes call the real YouCam APIs.

Notes:

- `.env.local` is git-ignored. **Never commit a real key.** The key is read only by server-side code (`src/lib/youcam.ts`) and never reaches the browser.
- Set `SKINCART_MOCK=1` to force demo mode even when a key is present (useful for rehearsals that shouldn't spend API units).
- If a live call fails (bad photo, insufficient units, …), the routes automatically fall back to demo data and the UI shows a "Demo data" badge — the flow never dead-ends. Photo errors from the API are translated into friendly retake messages.
- Live status of this submission: the hackathon's 1,000 free API units were redeemed and the live integration is **verified end-to-end** — skin analysis and both try-on effects (foundation, lipstick) run against the real YouCam APIs through this app's routes (see `test-log.md` at the repo root for the dated test record). The hosted demo runs live wherever `YOUCAM_API_KEY` is set in the host environment; without a key it runs the identical flow on the demo provider.

## Architecture

```
src/
  app/
    page.tsx                  Single-page flow: hero+upload → processing → results
    api/analyze/route.ts      POST selfie → provider → scores JSON
    api/try-on/route.ts       POST selfie + shade → provider → result image
  lib/
    types.ts                  SkinProvider interface + shared result shapes
    provider.ts               Live/demo selection + fallback handling
    youcam.ts                 Real YouCam V2 client (SERVER ONLY — reads the key)
    mock.ts                   Demo provider (deterministic, per-photo scores)
    concerns.ts               7-concern metadata, plain-English copy, friendly errors
    products.ts               10-product catalog + concern→product mapping + shades
  components/
    UploadDropzone.tsx        Drag/drop + photo-rules checklist + client-side resize
    ProcessingState.tsx       Step-by-step progress while the API task runs
    ScoreCard.tsx             One concern: score, band, animated bar, explanation
    RecommendationCard.tsx    Matched product + the score-quoting reason
    ShadePreview.tsx          Before/after drag slider for try-on results
    ProductArt.tsx            Product illustrations
public/
  sample-face.svg             Original illustrated sample portrait (no real person's photo)
```

**Design decisions worth knowing:**

- **One interface, two providers.** `mock.ts` and `youcam.ts` both implement `SkinProvider` (`analyzeSkin`, `tryOnMakeup`). The UI cannot tell them apart — that's what makes demo mode a faithful rehearsal instead of a separate fake.
- **YouCam V2 async flow.** The live client performs the documented sequence for each feature: `POST /s2s/v2.0/file/<feature>` → **PUT photo bytes to the pre-signed URL** → `POST /s2s/v2.0/task/<feature>` → poll `GET /s2s/v2.0/task/<feature>/<id>` every 2.5s with a 55s cap (inside serverless route limits). Auth is `Authorization: Bearer <YOUCAM_API_KEY>` on every call.
- **Skin Analysis (SD) panel.** All 7 concerns requested in one task with `enable_mask_overlay`; SD and HD actions are never mixed in a request. The UI displays the API's calibrated `ui_score`; `raw_score` is used internally to rank the weakest concerns.
- **Download results immediately.** YouCam result/mask URLs expire (~2h), so the server fetches them at once and returns data URLs. A stored raw URL is never treated as the result.
- **VTO, one effect per call.** Foundation (color + color/glow/coverage intensity) and lipstick (`lip_color`, shape `original` — never reshapes lips, full style, matte/satin palettes only). In demo mode the try-on preview is a clearly labelled *simulated* tint — the demo never pretends a simulated image is a true VTO render.
- **One resize serves both APIs.** Photos are downscaled client-side to ≤1600px long side, satisfying Skin SD minimums and the VTO size cap in a single step.
- **Deterministic demo data.** Demo scores are derived from a hash of the uploaded photo: the same photo always yields the same dashboard (comparable takes, honest rehearsals), and different faces produce visibly different recommendations.

## Tech stack

Next.js 15 (App Router) · TypeScript · React 19 · Tailwind CSS v4 · YouCam Skin Analysis API · YouCam Makeup Virtual Try-On API

## Author

**Wahaj Ansari** — solo entry, YouCam API Skin AI & eCommerce VTO Hackathon (Devpost), Skin AI category.
