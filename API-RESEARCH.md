# SkinCart — YouCam API Research

Prepared: 2026-10-26, for Wahaj Ansari's entry in the **YouCam API Skin AI & eCommerce VTO Hackathon** (Devpost, $6,000 prize pool, deadline **Nov 2, 2026, 11:45am ET**).
Entrant: Wahaj Ahmed Ansari, Devpost username `wahajansari08`, solo, Skin AI category.
Method: public web/docs research only. No accounts were created and no signup was performed during this research. Anything not confirmed on a public page is marked **UNVERIFIED**.

---

## 1. How a hackathon participant gets API access

### 1.1 The hackathon-specific flow (from the official Devpost hackathon page)

Source: https://youcam-api-skin-ai-ecommerce.devpost.com/

1. **Register for the hackathon on Devpost.** Wahaj's registration was completed 2026-10-26 (Skin AI category, solo).
2. **Get the exclusive redeem code by email** — the hackathon page's get-started steps say the code arrives by email after Devpost registration ("Get your exclusive redeem code by email (2 minutes)").
3. **Sign up for a YouCam API account** at `yce.perfectcorp.com` and verify the email address.
4. **Claim the units:** in the YouCam console go to **Account → Redeem Code**, enter the code — **"1,000 API Units will be added to your account immediately."**
5. **Every registered participant receives 1,000 free API units just for signing up** (hackathon page, confirmed wording).

Bonus units: the launch announcement (Business Wire, 2026-10-13) states participants can earn **500 bonus API units per qualifying demo video shared on social media, up to 2 per participant** — i.e. up to +1,000 extra units. Treat this as a stretch goal only; do not plan the build around it.

> ⚠️ **A human signup step IS required for the key.** There is no way to get an API key purely from the Devpost registration. A person must: create the Perfect Corp / YouCam account, click the email verification, redeem the emailed code, and copy the API key out of the console. See BUILD-CHECKLIST.md §"Human step: API key" for the exact click-by-click list. Do this the morning of **Oct 27** at the latest — the redeem code is gated behind the Devpost registration email, so any delay there eats build days directly.

Non-hackathon fallback if the redeem code never arrives: the Skin Analysis product page offers a standard free trial of **40 free units** on signup — enough to develop against and record a demo, not enough for heavy testing.
Source: https://yce.perfectcorp.com/ai-api/products/skin-analysis-api

### 1.2 Account, console and API key

- Developer portal / signup: https://yce.perfectcorp.com
- API key console: https://yce.makeupar.com/api-console/en/api-keys/
- Current docs home (the old `yce.perfectcorp.com/document/index.html` v1.9 docs, last modified Mar 31, 2026, point here): https://docs.perfectcorp.com/develop/introduction
- API server (V2): `https://yce-api-01.makeupar.com`
- Tooling environment-variable name: `YOUCAM_API_KEY`

### 1.3 Auth model (V2)

- **Simple Bearer API key. No separate auth/token-exchange call.**
- Every request carries the header:

  ```
  Authorization: Bearer <API Key>
  ```

- The key is long-lived and account-bound. **It must never ship to the browser.** In SkinCart it lives only in Next.js server-side route handlers (`app/api/.../route.ts`) read from the `YOUCAM_API_KEY` environment variable. The browser only ever talks to our own `/api/*` routes.
- Sources: https://docs.perfectcorp.com/develop/introduction ; API console key page above; docs request samples show `--header 'Authorization: Bearer <access_token for v1, API Key for v2>'` (fetched 2026-10-26 from https://yce.perfectcorp.com/document/index.html).

---

## 2. Common V2 request flow (all features)

Both Skin Analysis and Makeup VTO use the same asynchronous 3-step pattern:

| Step | Call | Notes |
|---|---|---|
| 1. Upload | `POST /s2s/v2.0/file/<feature>` | Returns a `file_id` **plus a pre-signed URL** in `requests.url`. You **must then PUT the raw file bytes to that pre-signed URL** — skipping the PUT is a known cause of 500/404 errors on the next step. |
| 2. Create task | `POST /s2s/v2.0/task/<feature>` | Body references the `file_id` (see per-feature payloads below). Returns a `task_id`. |
| 3. Poll result | `GET /s2s/v2.0/task/<feature>/<task_id>` | Poll until `task_status` is `success` or `error`. Poll every ~2–3s with a ~60s timeout in the UI. |

Alternative to step 1: a **public image URL** can be passed instead of an uploaded file (`src_file_url` / image URL field in task creation). SkinCart will use the upload flow because user selfies are local files, not hosted URLs.

Operational facts that shape the build:

- **Units are consumed only on success** — never while a task is running and never on error. Failed test calls are free; successful ones are not. Budget accordingly.
- **Results/files are retained ~24h; download links may expire in ~2h.** On success, immediately download/proxy the result images through our server route and render from there — do not leave raw result URLs sitting in the page for a later demo take.
- **Rate limits: 250 requests / 300 seconds and 5 QPS, enforced per IP *and* per token.** HTTP 429 on breach. Polling one task at 2–3s intervals is well inside this; never poll in a tight loop, and never run parallel test scripts against the same key.
- A **webhook** option exists (Standard Webhooks spec, HMAC-SHA256 signature, secret prefixed `whsec_`, managed at https://yce.makeupar.com/api-console/en/webhook/) — **not needed for SkinCart**; polling is simpler and sufficient for a single-user demo flow.
- A **balance endpoint** and a **feature-cost endpoint** exist and are free to call:
  - `GET https://yce-api-01.makeupar.com/s2s/v2.0/credit/feature-cost` (Bearer auth) returns the per-feature unit price list (see §3.4).
  - **First task after receiving the key: call feature-cost + balance and record the real numbers in this file.** The published sample (below) is partial.

Sources: https://yce.perfectcorp.com/document/index.html (V2 flow, webhook and feature-cost sections, fetched 2026-10-26); https://docs.perfectcorp.com/develop/introduction

---

## 3. Skin AI — Skin Analysis API

Feature name: **`skin-analysis`**

Endpoints (base `https://yce-api-01.makeupar.com`):

```
POST /s2s/v2.0/file/skin-analysis
POST /s2s/v2.0/task/skin-analysis
GET  /s2s/v2.0/task/skin-analysis/<task_id>
```

### 3.1 Request format

```json
{
  "src_file_id": "<file_id from the upload step>",
  "dst_actions": ["wrinkle", "pore", "texture", "acne", "moisture", "redness", "dark_circle_v2"],
  "miniserver_args": { "enable_mask_overlay": true },
  "format": "json"
}
```

- `dst_actions` = the list of concerns to score.
- `miniserver_args.enable_mask_overlay: true` returns one blended mask overlay image in addition to per-concern masks — use it for the results-page hero visual.
- `format: "json"` returns scores as JSON (the alternative is annotated images only).

### 3.2 SD vs HD — pick ONE family per request

**SD and HD concerns cannot be mixed in a single request** (doing so returns `InvalidParameters` / "cannot mix HD and SD dst_actions").

SD `dst_actions` (14 available):

```
wrinkle, pore, texture, acne, moisture, oiliness, redness, age_spot,
dark_circle_v2, eye_bag, firmness, droopy_upper_eyelid, droopy_lower_eyelid, radiance
```

HD variants are the same concerns prefixed `hd_` (e.g. `hd_wrinkle`, `hd_pore`) and some return sub-region scores (e.g. `hd_wrinkle`: forehead / glabellar / crowfeet / periocular / nasolabial / marionette / whole; `hd_pore`: forehead / nose / cheek / whole).

**SkinCart decision: use SD only.** Reasons: (1) the published unit tiers (§3.4) are for SD; (2) SD accepts smaller photos (short side ≥480px vs ≥1080px for HD), which is friendlier for real user selfies; (3) one family keeps the request, the UI mapping and the unit budget simple. HD adds cost and photo friction for detail a demo dashboard doesn't need.

**SkinCart panel (7 SD concerns):** `wrinkle, pore, acne, moisture, redness, age_spot, dark_circle_v2`
Chosen because each maps cleanly to a product category (see the recommendation mapping in BUILD-CHECKLIST.md) and 7 is the top of the published 5–7-concern price tier.

### 3.3 What the result returns

Per requested concern, an entry in the score info containing:

| Field | Meaning | SkinCart use |
|---|---|---|
| `raw_score` | Float 1–100. **Higher = healthier skin** for that concern. | Internal sorting only (find the weakest concerns). |
| `ui_score` | Integer 1–100, calibrated version of the score intended for display — Perfect Corp's own guidance is to use `ui_score` in consumer contexts. | **Display this one** on the score cards. |
| `mask_urls` / mask PNGs | Per-concern heatmap/mask images showing where the concern was detected; plus one blended overlay when `enable_mask_overlay` is on. | Overlay toggle on the results page; per-concern mask as the card thumbnail. |

Plus, at the top level:

- `all` — overall skin score across the requested concerns.
- `skin_age` — estimated skin age.

Product-page summary of capability: 28+ diagnostics across 16+ concerns, 0–100 scores, heatmap/mask overlays; also exposed via the JS Camera Kit (see §5).
Source: https://yce.perfectcorp.com/ai-api/products/skin-analysis-api ; field detail from https://yce.perfectcorp.com/document/index.html and https://docs.perfectcorp.com

### 3.4 Unit cost per call

From the official docs' `feature-cost` response sample (fetched 2026-10-26 from https://yce.perfectcorp.com/document/index.html):

| SKU (from the sample response) | Cost |
|---|---|
| "AI Skin Analysis for SD 1~4 concerns" | **9 units per result image** |
| "AI Skin Analysis for SD 5~7 concerns" | **12 units per result image** |

Budget math on the hackathon's 1,000 free units, using those tiers:

- 7-concern SD panel @ 12 units → **~83 full analyses** per 1,000 units.
- 4-concern SD panel @ 9 units → ~111 analyses.

That is comfortable for a 6-day build **if test calls are disciplined** (see the unit budget in BUILD-CHECKLIST.md).

**UNVERIFIED / reconcile on day 1:**
- The sample response above is paginated (`page_size` / `next_token`) and only those two SKUs were visible in the fetched sample. The full table (8+ concerns, HD pricing, VTO pricing) was **not** fully verified from public pages.
- One third-party Round-2 entrant's project (SkinTruth, https://github.com/kdjkdj1234567890-bit/skintruth) measured roughly ~4.5 units per concern (~36 units for an 8-concern check, ≈25+ checks per 1,000 units). That conflicts with the official sample tiers above. **Treat the third-party number as unverified.** Resolution step is built into Day 1 of the checklist: call `feature-cost` and the balance endpoint with the real key, and re-budget the panel size from the actual numbers before any heavy testing.

### 3.5 Photo requirements (enforce in the upload UI)

From the Skin Analysis docs/product page:

- Front-facing selfie, **face occupying 60–80% of image width (>60% is mandatory)**.
- Bright, even lighting; no harsh shadows.
- Mouth closed, eyes open, forehead fully revealed (hair off the face), glasses off recommended.
- Portrait orientation preferred.
- SD: short side ≥480px. HD: short side ≥1080px. Either: long side ≤4096px, file <10MB, `jpg` / `jpeg` / `png`.

Common API errors to map to friendly UI messages:

| Error | User-facing message in SkinCart |
|---|---|
| `error_src_face_too_small` | "Move closer — your face should fill most of the frame." |
| `error_lighting_dark` | "Too dark — face a window or a bright light and retake." |
| `error_no_face` | "No face detected — use a clear front-facing selfie." |
| `InvalidParameters` (mixed SD/HD) | Should never reach the user; it means a build bug (panel config). Log it. |

Sources: https://yce.perfectcorp.com/ai-api/products/skin-analysis-api ; https://yce.perfectcorp.com/document/index.html (skin analysis section incl. shooting guide and error images, fetched 2026-10-26)

---

## 4. Virtual Try-On — Makeup VTO API (lipstick + foundation)

Feature name: **`makeup-vto`**. Same async pattern as §2:

```
POST /s2s/v2.0/file/makeup-vto
POST /s2s/v2.0/task/makeup-vto
GET  /s2s/v2.0/task/makeup-vto/<task_id>     → on success, a result/download URL of the processed image
```

Errors include `CreditInsufficiency` and `InvalidApiKey`. As with Skin Analysis, **no units are consumed on error**.
**UNVERIFIED:** the exact unit cost of one makeup-vto call was not visible in the public docs sample fetched — confirm via the `feature-cost` endpoint on Day 1 and budget VTO test calls from that number.

### 4.1 Task payload format

```json
{
  "src_file_id": "<file_id from the makeup-vto upload step>",
  "version": "1.0",
  "effects": [ /* one object per makeup category, see 4.2 / 4.3 */ ]
}
```

(`src_file_url` — a public image URL — can replace `src_file_id`.)

SkinCart reuses the **same selfie** the user already uploaded for analysis: keep the analysis-step `file_id`/file bytes server-side for the session and re-upload under the `makeup-vto` feature when the user taps "Try this shade". Do not make the user upload twice.

### 4.2 Lipstick — `lip_color` effect

```json
{
  "category": "lip_color",
  "shape": { "name": "original" },
  "style": { "type": "full" },
  "palettes": [
    { "color": "#c2255c", "texture": "matte", "colorIntensity": 80 }
  ]
}
```

- `shape.name` **must equal a label** from the public lip-shape catalog: https://plugins-media.makeupar.com/wcm-saas/shapes/lipshape.json (labels include `original`, `heart-shaped`, `m-shaped`, `petal`, `plump`, `pouty`, `smile`, `vintage`). SkinCart uses `original` — never reshape the user's lips for a shade preview.
- `style.type`: `full` | `ombre` | `twoTone` (`ombre` additionally requires `innerRatio` and `featherStrength`). SkinCart uses `full`.
- `palettes[].texture`: `matte`, `gloss`, `holographic`, `metallic`, `satin`, `sheer`, `shimmer`. Extra palette fields are conditionally required: `gloss` for gloss/holographic/metallic/sheer/shimmer; `shimmerColor` + `shimmerIntensity` + `shimmerDensity` + `shimmerSize` for holographic/metallic/shimmer; `transparencyIntensity` for gloss/sheer/shimmer. **SkinCart uses `matte` and `satin` only** — they need just `color` + `colorIntensity`, which removes a whole class of payload errors.
- Optional `morphology`: `{ "fullness": 0–100, "wrinkless": 0–100 }` — leave unset for SkinCart.

### 4.3 Foundation — `foundation` effect

```json
{
  "category": "foundation",
  "palettes": [
    { "color": "#e8b48c", "colorIntensity": 50, "glowIntensity": 30, "coverageIntensity": 60 }
  ]
}
```

- No pattern/shape needed — foundation is a pure shade + intensity effect, which makes it the lowest-risk VTO call in the build.
- SkinCart plan: offer **foundation preview as the primary VTO** (it ties directly to skin concerns like redness/age spots) and **lipstick as the second shade card**. If time runs short, foundation alone still satisfies "uses a second YouCam API" — see the fallback ladder in BUILD-CHECKLIST.md.

### 4.4 Other categories (not in SkinCart v1, noted for scope control)

The same `effects` array supports 13 categories in total: `lip_color`, `foundation`, `concealer`, `blush`, `bronzer`, `contour`, `eye_shadow`, `eye_liner`, `eyebrows`, `highlighter` (docs name: `highlighter` effect object), `lip_liner`, `skin_smooth`, plus pattern-driven categories whose `pattern.name` must match a label in the public catalogs at `https://plugins-media.makeupar.com/wcm-saas/patterns/<category>.json` (e.g. `blush.json`, `lipliner.json`, `highlighter.json`).
Source: https://yce.perfectcorp.com/ai-api/products/virtual-makeup-try-on-api ; effect payload detail from https://yce.perfectcorp.com/document/index.html (makeup-vto section, fetched 2026-10-26).

Docs' own multi-effect example (same source) confirms effects compose in one call — e.g. `skin_smooth` + `blush` (pattern `2colors1`, two palettes) + `lip_color` (shape `plump`, gloss palette) in a single `effects` array. SkinCart still makes **one effect per call** so a failure in one shade never blocks the other and unit spend stays attributable.

### 4.5 VTO file specs & errors

From the docs' "File Specs & Errors" table for AI Makeup Virtual Try-On (fetched 2026-10-26):

| Constraint | Value |
|---|---|
| Dimensions | Long side < 1920px, face width ≥ 100px |
| File size | < 10MB |
| Formats | jpg / jpeg / png |

| Error code | Meaning |
|---|---|
| `error_below_min_image_size` | Source smaller than minimum (width ≥100px, height ≥100px expected) |
| `error_exceed_max_image_size` | Source larger than maximum (width <1920px, height <1080px expected) |
| `error_face_position_invalid` | Entire face must be fully visible in the image |
| `error_face_position_too_small` | Face too small — move closer to the camera |
| `error_face_position_out_of_boundary` | Face too large or partially outside the frame |

Build implication: **downscale the selfie client-side to max 1600px long side before upload.** One resize step satisfies both APIs (Skin SD needs short side ≥480px; VTO needs long side <1920px) and keeps uploads fast.

---

## 5. SDKs and other integration options

| Option | What it is | SkinCart verdict |
|---|---|---|
| **REST API V2** (§2) | The core integration; docs include request samples in curl, Node.js (≥18), JavaScript, Python (≥3.10), PHP and Java. | ✅ **Primary.** Called from Next.js route handlers. |
| **JS Camera Kit v2.2** | Browser SDK via CDN `https://plugins-media.makeupar.com/v2.2-camera-kit/sdk.js`, global `YMK`. Provides guided in-browser capture with face-quality validation (catches too-small / bad-lighting photos *before* spending an API call). | ⚠️ Stretch goal (Day 4 only if ahead of schedule). v1 ships with a plain file upload + the photo-rules checklist from §3.5. Do not let SDK integration block the core flow. |
| **API Playground** (in the console) | Point-and-click tester: paste key, set parameters, run, inspect payload + result. | ✅ Use on Day 1 to smoke-test the key and capture a real sample response for mock mode — zero code required. |
| **MCP server + Agent Skills** | Perfect Corp exposes the same APIs via an MCP server (`https://mcp-api-01.makeupar.com/mcp`, same Bearer API key, billed via the normal plan) and agent skills for AI coding tools. | ❌ Not used in the product. Potentially useful during development for quick API exploration; never a runtime dependency. |
| **Webhooks** (§2) | Standard Webhooks notifications on task completion. | ❌ Not needed; polling is enough. |

Sources: https://yce.perfectcorp.com/document/index.html (MCP + webhook + playground sections, fetched 2026-10-26); Camera Kit from the Skin Analysis product/docs pages; Perfect Corp blog on the MCP integration: https://www.perfectcorp.com/business/blog/ai-skincare/skin-analysis-api-claude-mcp-integration

---

## 6. Hackathon submission requirements (Devpost page)

Source: https://youcam-api-skin-ai-ecommerce.devpost.com/

A complete submission needs **all** of:

- [ ] A **working web or mobile prototype** integrating **at least one** YouCam API. (SkinCart uses two: Skin Analysis + Makeup VTO.)
- [ ] **Code repository URL** — public, or private **shared with the testing email address shown on the hackathon page** (copy that address from the page at submission time; do not guess it).
- [ ] **Text description** explaining the features and the consumer/retail value.
- [ ] **Screenshots** of the project.
- [ ] **Demo video, 1–3 minutes, publicly visible** on YouTube (preferred), Vimeo or Youku. It must **explain which YouCam API(s) are used** and **show the project functioning on its device**. No unlicensed third-party trademarks or music in the video.
- Winners must additionally do an **exit interview** and appear in a **blog article** (post-win obligation, not a submission blocker).

Judging criteria (weight the build/demo against these): **Technological Implementation, Design, Potential Impact, Quality of Idea.**

Prizes: 1st $2,500 · 2nd $1,000 · 3rd $500 · Women in Tech $1,000 · Rising Star (student) $1,000. Wahaj (solo, professional, non-student) competes in the **main pool only** — realistic target is 1st–3rd. Winners announced ~Nov 24, 2026. Round 1 of this series drew 1,280 registrants / 238 submissions, so a complete, working, well-demoed two-API entry is already well above the median submission.

---

## 7. Source list

| # | Source | Used for |
|---|---|---|
| 1 | https://youcam-api-skin-ai-ecommerce.devpost.com/ | Hackathon access flow, 1,000 free units, redeem-code steps, submission requirements, judging, prizes, deadline |
| 2 | https://yce.perfectcorp.com/document/index.html | V2 endpoint patterns, auth header, feature-cost sample (9 / 12 units), webhook + MCP sections, makeup-vto payloads + file specs + error codes (fetched 2026-10-26) |
| 3 | https://docs.perfectcorp.com/develop/introduction | Current docs home, Bearer key model, base server |
| 4 | https://yce.perfectcorp.com/ai-api/products/skin-analysis-api | Skin Analysis capability summary, photo rules, 40-unit standard free trial |
| 5 | https://yce.perfectcorp.com/ai-api/products/virtual-makeup-try-on-api | Makeup VTO category list (13) |
| 6 | https://yce.makeupar.com/api-console/en/api-keys/ | Where the API key is created/copied |
| 7 | https://plugins-media.makeupar.com/wcm-saas/shapes/lipshape.json and `.../patterns/<category>.json` | Valid `shape.name` / `pattern.name` label catalogs |
| 8 | Business Wire launch release, 2026-10-13 (via hackathon coverage) | 500 bonus units per social demo video, max 2 |
| 9 | https://github.com/kdjkdj1234567890-bit/skintruth | Third-party per-concern unit measurement — **unverified**, see §3.4 |
| 10 | https://www.perfectcorp.com/business/blog/ai-skincare/skin-analysis-api-claude-mcp-integration | MCP/key guidance, `ui_score` for consumer contexts, HD endpoints in free trial |

### Explicitly unverified (do not quote as fact anywhere public)

1. Full feature-cost table beyond the two SD tiers in the docs sample (8+ concern pricing, HD pricing, makeup-vto unit cost) — resolve Day 1 via the live `feature-cost` endpoint.
2. Exact delivery time of the hackathon redeem-code email after Devpost registration ("2 minutes" is the hackathon page's own claim, not an observed delivery).
3. Whether the 1,000 hackathon units expire, and if so when — not stated on the public pages found. Assume they are hackathon-scoped and spend/test as if they end with the event.
4. Camera Kit v2.2 licensing/keys for production use beyond the hackathon demo — not needed for v1 (see §5).
