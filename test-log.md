# SkinCart — Live API Test Log

Test date: 2026-10-28. Key: "SkinCart" (Activated, expires 2026-12-27). Units: 1,000 granted, valid to 2027-01-26.
Test photo: `test-photos/` — an AI-generated photorealistic portrait of a fictional person (no real person's photo used).

## Result: BOTH APIs VERIFIED LIVE through the app's own routes

| Call | Route | Result |
|---|---|---|
| Skin analysis | POST /api/analyze | mode: live, no fallback. overall 71, skinAge 44 — matches the raw API fixture exactly. All 7 panel concerns returned (wrinkle 72, pore 62, acne 79, moisture 69, redness 72, age_spot 69, dark_circle_v2 74), masks re-served as data URLs. |
| Foundation VTO | POST /api/try-on | mode: live, simulated: false, result image returned. |
| Lipstick VTO | POST /api/try-on | mode: live, simulated: false, result image returned. |

## Adapter bugs found by the live test and fixed in src/lib/youcam.ts

1. **file_size is required** in the file-create body — omitting it returns HTTP 400 InvalidParameters ("file_size is required but wasn't included in your request"). The docs-derived adapter missed it. Fixed: `file_size: image.length`.
2. **Signed upload URL path** is `data.files[0].requests[0].url` (adapter looked in the wrong places). Fixed.
3. **Skin result shape**: `data.results.output[]` keyed by `type`; overall = the `type:"all"` entry's string `score` field; skin age = `type:"skin_age"` entry's `score`. Adapter now parses this (fixture: `app/fixtures/sample-score-info.json`). Per-concern mask URLs are signed/expiring, so they are downloaded and re-served as data URLs like the overlay.
4. **VTO result shape**: `data.results.url` (a plain string). Adapter now reads it first (fixture: `app/fixtures/sample-vto-result.json`).
5. **Result content type**: S3 returns results as binary/octet-stream, and VTO bytes are PNG even under a .jpg URL. `fetchAsDataUrl` now sniffs magic bytes (PNG/JPEG/WebP) when the header is not an image type. Verified: try-on now returns `data:image/png;base64,iVBORw...`.

## Unit spend (test day)

- Skin analyses succeeded 3 times (2 direct debug runs + 1 via the app) at the documented 12-unit tier for a 7-concern SD panel ≈ 36 units.
- Makeup VTO tasks succeeded 5 times (1 debug + 4 via the app; one app attempt parsed wrong but the task itself succeeded, so it counts). VTO per-call cost was not in the public docs sample — total day spend estimated under ~60 of 1,000 units. Exact figure is visible in the console usage view.
- Failed calls (the file_size 400s) consumed nothing — units are charged only on success.

## Addendum — screenshot session (2026-10-28, later)

All five submission screenshots were recaptured from the live build by driving it with Playwright (upload → processing → live dashboard → recommendations → foundation try-on in "Sand Glow"). The dashboard capture shows overall 71 / skinAge 44 with real mask overlays and no Demo badge; the try-on capture shows the real before/after slider with the "Rendered by YouCam Makeup VTO" badge. Extra spend for the capture session: ~4 analyses + ~3 VTO tasks (including two try-on attempts lost to a capture-script mistake — the UI needs a shade click after the "Try this shade" button; the app itself was never at fault). Total day spend still comfortably under ~120 of 1,000 units.

## Notes

- No mask-overlay entry appeared in the skin result despite `enable_mask_overlay: true`; per-concern masks are present and used instead. The UI only shows the overlay toggle when an overlay exists, so this is graceful.
- The balance endpoint path is not /credit or /credit/balance (both 404) — check balance in the web console.
