# SkinCart — Demo Video Script (target ≈ 2:15, hard limit 3:00)

**Format rules (from the hackathon page):** publicly visible (YouTube preferred) · must explain the YouCam API(s) used · must show the project functioning · no unlicensed third-party trademarks or copyrighted music — use royalty-free/own audio and generic product names only (the app already uses generic names throughout).

**Recording rules:** record at 1080p from the production build, desktop width (the layout is responsive; one short mobile beat is optional). Rehearse the full click-through once before recording — the sample-portrait path is deterministic, so every take of it looks identical. Cursor movements slow and deliberate; pause ~1s on each screen before speaking over it.

**Recording status (2026-10-28): RECORDED IN LIVE MODE.** The redeem code was redeemed successfully on the makeupar console on 2026-10-28 and the API key activated, so the video was recorded against the real YouCam APIs with a real photo upload: live skin analysis (overall 71, skin age 44), live foundation and lipstick try-on. No Demo badge or Simulated label appears anywhere in the recording. The finished video is `submission/demo-video.mp4` (1:43, 1080p, narrated, captions burned in; sidecar captions at `submission/video/captions.srt`). Upload it to YouTube as public with the title below and paste the URL into the Devpost form.

---

## Shot list

| # | Time | Shot (what's on screen) | Narration (voiceover) | On-screen text |
|---|---|---|---|---|
| 1 | 0:00–0:12 | Title card over the SkinCart landing hero: "One selfie. Zero guessing." Slow push-in. | "Online beauty shoppers guess. Wrong product, wrong shade — and it gets returned. SkinCart ends the guessing." | **SkinCart — One selfie. Zero guessing.** |
| 2 | 0:12–0:25 | Landing page: the 4-step explainer and the header line. Cursor drifts down to the upload panel. | "SkinCart is built on two YouCam APIs: Skin Analysis to diagnose, and Makeup Virtual Try-On to preview. It starts with a selfie." | **Built with YouCam Skin Analysis API + Makeup Virtual Try-On API** |
| 3 | 0:25–0:40 | Upload panel: photo-rules checklist visible. Click **"No photo handy? Try with a sample portrait →"**. The sample portrait loads; processing state appears with its step-by-step progress over the photo. | "SkinCart checks the photo against YouCam's quality rules up front, then the Skin AI scores seven skin concerns — usually in seconds." | 7 concerns · one selfie |
| 4 | 0:40–1:05 | Results dashboard: "Your skin report" — overall score + skin age beside the portrait, then a slow scroll through the 7 concern cards (animated bars, bands, plain-English lines). Pause on one "Needs care" card. | "Fine lines, pores, blemishes, hydration, redness, dark spots, dark circles — each scored out of a hundred, and explained in plain English, not dermatology jargon." | Scores out of 100 · plain English |
| 5 | 1:05–1:30 | Continue scrolling to the matched trio: three recommendation cards. Highlight the reason line on two of them (zoom or cursor underline). Brief beat on the "Complete the routine" row. | "The three weakest scores become three matched products — and every pick quotes the score that caused it. No score, no recommendation." | Every pick explains itself |
| 6 | 1:30–1:58 | Try-on section: foundation card — click a shade (e.g. **Honey Veil**). The before/after preview appears; drag the slider slowly left → right → left. Then the lipstick card — click **Rosewood Matte**, quick slider drag. | "And before anyone buys, the shade goes on the shopper's own photo. Foundation first… then lipstick — previewed, not imagined." | YouCam Makeup Virtual Try-On |
| 7 | 1:58–2:15 | Closing card over the dashboard: closing line, then end card with live URL + repo URL. | "Two YouCam APIs. One selfie. Zero guessing. That's SkinCart — try it yourself." | **SkinCart** · [live URL] · [repo URL] |

**Total spoken words ≈ 150 (≈ 65 seconds of voice at a relaxed pace) — the pauses between lines are intentional; let the UI breathe.**

---

## Production notes

- **Music:** low-volume royalty-free bed under the whole video; duck under narration. No commercial tracks.
- **Captions:** burn in or upload a caption track — judges may watch muted; the story must read without audio.
- **The badge:** the "Demo data" pill on the results screen and the "Simulated preview" label on try-on are part of the product's honesty design. Keep them visible; if a valid API key is activated before recording, re-record in live mode and both labels disappear on their own (live VTO results show no "simulated" label, and live analysis drops the demo badge).
- **Takes:** record shots 3–6 in one continuous session so the portrait, scores, and recommendations all belong to the same deterministic sample run. If a take goes wrong mid-flow, restart from shot 3 — the sample path reproduces identically, so editing across takes is seamless.
- **Upload:** YouTube, **public**, title "SkinCart — One Selfie. Zero Guessing. | YouCam API Hackathon", description linking the live demo and repo. Paste the video URL into the Devpost submission form (do not use an unlisted link unless the hackathon page explicitly allows it).
