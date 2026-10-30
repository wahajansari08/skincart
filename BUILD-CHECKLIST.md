# SkinCart — Build Checklist (Oct 27 → Nov 1 submit)

Hackathon: **YouCam API Skin AI & eCommerce VTO Hackathon** — $6,000 pool, Devpost.
**Hard deadline: Nov 2, 2026, 11:45am ET (= 9:45pm PKT). Submit target: Nov 1** — a full day of buffer, because Devpost submission forms, video uploads and "one last fix" always take longer than planned.
Entrant: Wahaj Ahmed Ansari (`wahajansari08`), solo, Skin AI category. API facts: see `API-RESEARCH.md` in this folder.

**Concept (one line):** Upload a selfie → YouCam Skin AI scores 7 skin concerns → dashboard explains the scores in plain English → 3 product recommendations matched to your weakest concerns, each with a reason → preview a recommended foundation/lipstick shade on your own photo via YouCam Makeup VTO.

**Two-API story is the differentiator.** Most entries will use one API. SkinCart's submission, demo and description must all repeat: *"SkinCart uses two YouCam APIs — Skin Analysis to diagnose, Makeup Virtual Try-On to preview."*

---

## Human step: API key (Oct 27, morning — before any integration work)

An agent cannot do this (account creation + email verification + console login are Wahaj's). Wahaj (or Be with Wahaj present) does exactly this, ~10 minutes:

1. Open the inbox of the email used for the Devpost registration and find the **YouCam hackathon redeem-code email** sent after Devpost registration. Copy the code. (If it is not there by Oct 27 morning, check spam/promotions, then see Risk R1.)
2. Go to **https://yce.perfectcorp.com** → sign up with the **same email** → complete **email verification** (click the link in the verification email).
3. Log in → **Account → Redeem Code** → paste the code → confirm the balance shows **1,000 units**.
4. Go to the API key console: **https://yce.makeupar.com/api-console/en/api-keys/** → create/copy the **API key**.
5. Hand the key over via the secure channel (never plain chat/email/notes). It goes into:
   - Local dev: `.env.local` as `YOUCAM_API_KEY=...` (file is git-ignored — verify before first commit).
   - Hosting (Vercel): Project → Settings → Environment Variables → `YOUCAM_API_KEY` (Production + Preview).
6. Smoke test in the console **API Playground**: run one Skin Analysis on any clear selfie → confirms the key works and shows a real response shape. **Save that full JSON response** as `fixtures/sample-score-info.json` in the repo (personal data scrubbed / use a stock test face) — this file powers mock mode (see Risks).
7. Report back two numbers: **unit balance** and, from `GET /s2s/v2.0/credit/feature-cost`, the **real cost of (a) a 7-concern SD skin analysis and (b) one makeup-vto call**. Re-budget the test-call allowance in §"Unit budget" with the real numbers before Day 2.

**Definition of done for this step:** key in `.env.local`, Playground test succeeded, balance + real costs recorded, sample response saved.

---

## Unit budget (1,000 free units — spend like it's cash)

Units are charged **only on successful calls**, so errors are free — but every successful test analysis/VTO is not. Working budget (re-price on Day 1 with real feature-cost numbers; planning figures from API-RESEARCH.md §3.4):

| Use | Planning cost | Allowance | Units |
|---|---|---|---|
| Skin analysis dev/testing (7-concern SD) | ~12 / call | 25 calls | ~300 |
| Makeup VTO dev/testing | TBD Day 1 | 20 calls | ~200 (hold) |
| Demo-video takes (live, on camera) | analysis + VTO per take | 5 full takes | ~150 |
| Final live verification + judges-may-test buffer | — | — | ~150 |
| **Reserve — do not spend** | — | — | **~200** |

Rules: develop against **mock mode** by default; flip to live API only for deliberate test runs. Never loop-test. One named test selfie set (3 photos) reused for every test so results are comparable.

---

## Architecture (Next.js, single repo)

```
skincart/
  app/
    page.tsx                  → landing + upload (step 1)
    results/page.tsx          → score dashboard + recommendations (steps 2–3)
    try-on/page.tsx           → VTO shade preview (step 4)   [can be a section on results/ if time is short]
    api/
      analyze/route.ts        → POST: receives image → YouCam upload → create task → poll → returns score JSON
      try-on/route.ts         → POST: receives file ref + shade → makeup-vto upload/task/poll → returns result image URL
  components/
    UploadDropzone.tsx        → file picker + drag/drop + photo-rules checklist + client-side resize
    ScoreCard.tsx             → one concern: ui_score dial/bar, plain-English explanation, mask thumbnail
    MaskOverlay.tsx           → original photo with blended mask overlay toggle
    RecommendationCard.tsx    → product, matched concern, "why this one" reason, price-style display, Try shade button
    ShadePreview.tsx          → before/after slider (original vs VTO result)
    ProcessingState.tsx       → step-by-step progress while polling (uploading → analyzing → scoring)
  lib/
    youcam.ts                 → server-only client: uploadFile(), createTask(), pollTask(), analyzeSkin(), tryOnMakeup()
    concerns.ts               → concern metadata: label, plain-English text per score band, icon
    products.ts               → static curated product catalog + concern→product mapping
    mock.ts                   → mock mode: returns fixtures/sample-score-info.json (+ a pre-made VTO result image)
  fixtures/
    sample-score-info.json    → real captured Skin Analysis response (from the Day-1 Playground test)
    sample-vto-result.jpg     → one real captured VTO output for mock mode
  public/products/            → product images (own photos or clearly-licensed placeholders — no brand trademarks in demo assets)
```

Key implementation notes:

- **API key is server-only.** `lib/youcam.ts` must never be imported by a client component. Browser → our `/api/*` routes → YouCam. Set `export const runtime = 'nodejs'` on the API routes and a generous `maxDuration` (polling can take 10–30s).
- **One client-side resize for both APIs:** downscale to ≤1600px long side, keep short side ≥480px, export JPEG quality ~0.9. Satisfies Skin SD minimums and the VTO <1920px long-side cap in one step.
- **Poll, don't webhook.** Poll the task endpoint every 2–3s, 60s timeout, surface progress states. Well inside the 250-req/300s + 5 QPS limits.
- **Download results immediately.** Result/mask URLs can expire (~2h links, ~24h file retention). The `/api/analyze` route should fetch mask/overlay images and re-serve them (or return them as data the page renders at once); never store a raw YouCam URL as "the result" for later.
- **State:** analysis result + the resized image in `sessionStorage`/in-memory context only. No accounts, no database, no server-side storage of faces. Say so on the landing page ("Your photo is processed for analysis and never stored") — it's true, and judges like hearing it.
- **Mock mode:** `NEXT_PUBLIC_MOCK=1` (or auto-fallback on API error with a visible "Demo data" badge) renders the full flow from fixtures. This is the insurance policy for the demo video and for judges if units run dry.

### Recommendation mapping (static, curated — `lib/products.ts`)

Map the **3 lowest `ui_score` concerns** → one product each. ~10 products total in the catalog; name them generically (no real brand trademarks — the demo video rules prohibit unlicensed third-party trademarks).

| Concern (dst_action) | Product type to recommend | Reason template |
|---|---|---|
| `acne` | Gentle salicylic-acid cleanser | "Your acne score is your lowest — a BHA cleanser targets clogged pores without stripping." |
| `moisture` | Hyaluronic-acid hydrating serum | "Moisture scored {n}/100 — this serum layers water-binding humectants under your moisturizer." |
| `wrinkle` | Retinol night cream | "Fine lines are most visible around the eyes/forehead in your mask — retinol is the best-studied topical for them." |
| `age_spot` | Vitamin C brightening serum | "Pigmentation spots showed up in your overlay — vitamin C is the standard brightening step." |
| `redness` | Centella calming moisturizer | "Redness scored low, mostly across the cheeks — a barrier-first calming cream reduces flare-ups." |
| `dark_circle_v2` | Caffeine eye cream | "Dark circles were detected under both eyes — caffeine eye creams target the tired look." |
| `pore` | Niacinamide pore-refining toner | "Enlarged pores concentrated on the nose/cheeks — niacinamide regulates oil and refines their look." |

Each `RecommendationCard` also carries shade data for VTO: the top recommendation that is a **foundation** (add one "Perfect-match foundation" card tied to redness/age_spot) and one **lipstick** card get a "Try this shade on your photo" button → `/api/try-on`.

---

## Day-by-day plan

### Day 1 — Tue Oct 27: Key + scaffold + mock flow end-to-end
- [ ] **Morning: human API-key step (above) — nothing else waits on anything else; this goes first.**
- [ ] `npx create-next-app@latest skincart` (TypeScript, Tailwind, App Router) → git init → private GitHub repo created (public later at submission, or private + shared with the hackathon testing email).
- [ ] `.env.local` with `YOUCAM_API_KEY`; confirm `.env*` is in `.gitignore` before the first commit.
- [ ] With the Playground sample: save `fixtures/sample-score-info.json`; build `lib/mock.ts`.
- [ ] Build `page.tsx` landing + `UploadDropzone` with the photo-rules checklist (face 60–80% of frame, bright even light, forehead visible, glasses off) and client-side resize.
- [ ] Build `results/page.tsx` rendering **mock** scores: `ScoreCard` × 7, overall `all` score + `skin_age` header, `MaskOverlay` toggle (mock mask image).
- [ ] Record real feature-cost numbers into API-RESEARCH.md §3.4 and re-budget.
- **End-of-day test:** full click-through on mock data, phone + desktop widths.

### Day 2 — Wed Oct 28: Live Skin Analysis integration
- [ ] `lib/youcam.ts`: `uploadFile` (POST file → **PUT bytes to the pre-signed URL** — do not skip), `createTask`, `pollTask`.
- [ ] `app/api/analyze/route.ts`: image in → analysis JSON out (scores + immediately-fetched mask/overlay), friendly error mapping per API-RESEARCH.md §3.5 (`error_src_face_too_small`, `error_lighting_dark`, `error_no_face`).
- [ ] Wire results page to live data; keep mock fallback behind env flag + on-error badge.
- [ ] Test with the 3-photo test set only. Log every call (time, concerns, units before/after) in a `test-log.md`.
- [ ] Deploy a first preview to Vercel (env var set) and test the hosted URL — judges will use the hosted link, not localhost.
- **End-of-day test:** one live analysis on the hosted URL, start to finish, on a phone.

### Day 3 — Thu Oct 29: Recommendations + dashboard polish
- [ ] `lib/products.ts` catalog (~10 products, images, shade metadata) + weakest-3 mapping logic + reason text.
- [ ] `RecommendationCard` list under the dashboard; overall-score summary sentence ("Your skin scored 72 overall — hydration and dark circles are your two biggest wins available").
- [ ] Design pass: storefront-clean layout, consistent type scale, score bars animated, mobile-first. This is the "Design" judging criterion — budget real hours here.
- [ ] Landing page copy: problem (shoppers guess shades/products and return them), solution, the two-API line, privacy note.
- [ ] README.md in repo: what it is, APIs used, how to run, env var, architecture diagram-in-words.
- **End-of-day test:** live flow ×3 different faces; confirm recommendations change appropriately per face.

### Day 4 — Fri Oct 30: Makeup VTO integration
- [ ] `app/api/try-on/route.ts`: reuse the session selfie → `makeup-vto` upload → task with ONE effect → poll → return result image.
- [ ] Foundation first (simplest payload: shade hex + color/glow/coverage intensity). Then lipstick (`lip_color`, shape `original`, style `full`, matte/satin palette only).
- [ ] `ShadePreview` before/after slider on the results page; 2–3 shade options per product card.
- [ ] Capture one real VTO output into `fixtures/sample-vto-result.jpg` for mock mode.
- [ ] If (and only if) VTO is fully working by midday: optional Camera Kit guided-capture experiment on a branch. Never merge it the same day it's written.
- **End-of-day test:** full live journey — upload → scores → recommendations → foundation preview → lipstick preview — recorded once as a rough cut (this is the demo-video rehearsal).

### Day 5 — Sat Oct 31: Harden, deploy, record the demo
- [ ] Freeze features at noon. After noon: bug fixes, copy, performance only.
- [ ] Production deploy; test hosted URL cold (new browser, phone data connection). Check API-route timeout behaviour on Vercel.
- [ ] Check unit balance; confirm the reserve (~200) is intact for judging period.
- [ ] Take the **screenshots** for Devpost (see submission checklist) from the production URL.
- [ ] **Record the demo video** per the shot list below; edit to ≤3 min; upload to YouTube as **public** (or unlisted only if the hackathon page allows — default public); captions on.
- [ ] Draft the full Devpost description (text in the submission checklist) in a doc, not directly in the form.
- **End-of-day test:** watch the video muted — the story must make sense without audio.

### Day 6 — Sun Nov 1: SUBMIT (target day)
- [ ] Final repo state: README complete, no keys anywhere in history (`git log -p | grep -i youcam` sanity check), repo public OR shared with the testing email from the hackathon page.
- [ ] Fill the Devpost submission form field-by-field from the checklist below; paste the pre-written description.
- [ ] Attach: hosted URL, repo URL, video link, screenshots.
- [ ] Submit **before end of day PKT**. Screenshot the "Submitted" confirmation.
- [ ] Post-submission: re-open the project page as a visitor and click every link.
- **Nov 2 is now pure buffer** for a Devpost outage or a rejected-field fix. Deadline 11:45am ET / 9:45pm PKT.

---

## Demo video shot list (1–3 min, target ~2:15)

Rules from the hackathon page: publicly visible (YouTube preferred), must **explain the YouCam API(s) used**, must **show the project functioning**, no unlicensed third-party trademarks/music (use royalty-free/own audio, generic product names).

| Time | Shot | Narration / on-screen text |
|---|---|---|
| 0:00–0:12 | Title card + the problem: a shopper scrolling a beauty store, guessing. | "Online beauty shoppers guess. Wrong shade, wrong product — and it gets returned." |
| 0:12–0:25 | SkinCart landing page; cursor clicks Upload. On-screen text: **"Built with the YouCam Skin Analysis API + Makeup Virtual Try-On API"** | "SkinCart starts with a selfie." |
| 0:25–0:40 | Photo-rules checklist visible; selfie selected; processing state runs (**live API**, not mock — keep ≥4 full live takes in the unit budget). | "YouCam's Skin AI analyzes seven skin concerns in seconds." |
| 0:40–1:05 | Results dashboard: overall score + skin age, score cards animate in, mask overlay toggled on. | "Wrinkles, pores, acne, moisture, redness, dark spots, dark circles — each scored out of 100, in plain English." |
| 1:05–1:30 | Scroll to recommendations; three cards, each reason line highlighted. | "The three weakest scores become three matched products — each with the reason it was picked for *this* face." |
| 1:30–1:55 | Click "Try this shade" on foundation → before/after slider sweeps. Then lipstick shade change. | "And before buying, preview the shade on your own photo with YouCam Virtual Try-On." |
| 1:55–2:15 | Closing card: live URL + repo, "Two YouCam APIs. One selfie. Zero guessing." | "SkinCart — analysis to try-on in under a minute. Try it live at [URL]." |

Recording rules: record at 1080p from the **production URL**; rehearse the full flow once before recording (Day-4 rough cut); if a live call fails mid-take, retake — never edit around a failure in a way that misrepresents the flow; keep the mock-mode badge off by using live mode for every take.

---

## Devpost submission field checklist

Copy the exact field names from the live submission form on Nov 1 — the list below is the content that must exist, mapped to the standard Devpost fields + this hackathon's requirements (API-RESEARCH.md §6).

- [ ] **Project name:** SkinCart
- [ ] **Tagline / elevator pitch:** "One selfie → AI skin scores → matched products → try the shade on your own face. Powered by two YouCam APIs."
- [ ] **Description — Problem:** beauty eCommerce guessing game; wrong products/shades; returns and abandoned carts.
- [ ] **Description — Solution:** the 4-step flow (upload → analysis → recommendations → VTO preview).
- [ ] **Description — How it works / APIs used (name both explicitly):** "YouCam AI Skin Analysis API (SD, 7 concerns, `ui_score` + mask overlays) for diagnosis; YouCam Makeup Virtual Try-On API (`foundation` + `lip_color` effects) for shade preview. Next.js server routes keep the API key off the client; the browser polls task status through our own API."
- [ ] **Description — Consumer & retail value:** fewer wrong purchases, fewer returns, higher conversion confidence; a retailer can embed the same flow on any product page.
- [ ] **Description — Challenges & what was learned:** async task polling, SD/HD panel design, unit budgeting, photo-quality UX (turning API face/lighting errors into friendly retake guidance).
- [ ] **Description — Built with:** Next.js, TypeScript, Tailwind CSS, YouCam Skin Analysis API, YouCam Makeup VTO API, Vercel.
- [ ] **Try it out links:** hosted demo URL (production, tested cold) — required.
- [ ] **Code repository link:** public repo, or private repo shared with the testing email shown on the hackathon page.
- [ ] **Video link:** YouTube, public, 1–3 min, per shot list above.
- [ ] **Screenshots (min. 4):** 1) landing + upload, 2) processing state, 3) results dashboard with mask overlay on, 4) recommendations, 5) VTO before/after. (5th is bonus.)
- [ ] **Category confirmation:** Skin AI (as registered).
- [ ] **Final click-through** of the submitted project page as a logged-out visitor before declaring done.

---

## Risks & fallbacks

| # | Risk | Likelihood / impact | Fallback (pre-built, not improvised) |
|---|---|---|---|
| R1 | **Redeem-code email delayed or missing** — no code → no 1,000 units → no key budget. This is the single biggest deadline risk: every build day depends on it. | Medium / Critical | Build Days 1–3 entirely in **mock mode** (Playground-free: hand-write a fixture matching the documented response shape, then replace it with a real capture the hour the key lands). In parallel: claim the standard **40-unit free trial** on the Skin Analysis product page the moment the code is >24h late — enough to integrate live + record the demo. Escalate to hackathon organizers via the Devpost discussion page if the code hasn't arrived by Oct 28. |
| R2 | **Unit budget burns faster than planned** (real per-call cost higher than the docs sample — a third-party report suggests it could be, see API-RESEARCH.md §3.4). | Medium / High | Re-price on Day 1 from the live `feature-cost` endpoint. If needed: drop the panel from 7 → 4 concerns (cheaper tier, still a real dashboard), develop in mock mode, reserve units for demo takes + judging buffer. The reserve (~200 units) is never spent on development. |
| R3 | **VTO payload friction** (pattern/shape label mismatches, conditional palette fields). | Medium / Medium | Foundation-only VTO is the floor (no pattern, no conditional fields) and alone satisfies the second-API claim. Lipstick uses `matte`/`satin` + shape `original` only. If lipstick still fights on Day 4, cut it — do not let it eat Day 5. |
| R4 | **Result/mask URLs expire before the demo** (~2h links). | High if ignored / Low if handled | Server routes fetch and re-serve result images immediately (§Architecture). Demo is recorded in one sitting against fresh live runs; screenshots are taken from the same session. |
| R5 | **Bad user photos fail analysis** during judging (dark, small face). | Medium / Medium | Upload UI enforces the documented photo rules up front; API errors map to friendly retake messages; landing page includes one-click **"Try with a sample photo"** that runs the flow on a known-good test selfie — judges always have a working path. |
| R6 | **Vercel route timeouts** while polling slow tasks. | Low / Medium | Cap poll window at ~55s inside the route; if a task outruns it, return the `task_id` and let the client re-poll a lightweight status route. Test cold on Day 2, not Day 5. |
| R7 | **API key leaks** into the repo/client bundle. | Low / Critical | Server-only `lib/youcam.ts`; `.env*` git-ignored and verified before first commit; pre-submit history grep; if a leak is ever suspected, rotate the key in the console immediately and update both env locations. |
| R8 | **Devpost form / upload problems on deadline day.** | Low / High | The entire reason for the **Nov 1 submit target**: description pre-written in a doc, screenshots and video finished Oct 31, Nov 2 kept as pure buffer. |
| R9 | **Scope creep** (cart, checkout, accounts, Camera Kit). | High / Medium | SkinCart is a *recommendation + preview* demo. No cart, no payments, no login, no database. Camera Kit is a Day-4 branch-only experiment. Anything not in this checklist needs a conscious trade against a listed item. |

### Mock mode — the standing insurance policy

Mock mode is not a degraded version; it is the same UI driven by a **real captured API response** (`fixtures/sample-score-info.json` + `sample-vto-result.jpg`), with a visible "Demo data" badge whenever it is active. It exists so that: development never waits on the key (R1), the demo can be rehearsed without spending units (R2), and the hosted site still tells the complete story if the judging window opens after units run out. It is **never** used in the submitted demo video — the video shows live calls.
