# Validation and delivery status

Validated November 26, 2026, Asia/Manila.

## Capture coverage

All 21 required capture slots are populated, visually reviewed, and validated at 1920 x 1080. Normal login succeeded for Student, Alumni, Registrar, Cashier and Administrator after the user configured local credentials and confirmed synthetic-only data.

Captured interfaces: landing, sign-in, application, status lookup, five role dashboards, subject selection, enrollment status, Registrar applications and enrollment detail, approved enrollment record, student payment detail, GCash document proof form, Cashier payment list and official receipt, alumni document creation/status, and Registrar document management.

The initial sandboxed pass omitted external icons/fonts/charts. The accepted images were recaptured with the application's own CDN assets loaded. Every recapture reset its review flag before visual inspection. Live GCash account and QR areas are hidden. The proof form contains DEMO-REFERENCE-ONLY and no uploaded file.

## Validation performed

- npm run check: ESLint, TypeScript, continuous eight-scene timeline, and available asset checks passed.
- node scripts/validate-assets.mjs --strict: 21/21 required images passed file/path, PNG signature, 1920 x 1080 dimensions and review checks.
- Capture and render script syntax checks passed. Unknown --only capture IDs were confirmed to fail before browser launch.
- git diff --check passed, with ordinary LF/CRLF conversion notices only.
- Studio is available at http://localhost:3000/DTCEMSDemo (HTTP 200).
- Rendered 22 representative frames across the fully populated composition. Visually reviewed the dashboards, subject selection, Registrar payment-gate spotlight, approved record, GCash proof fields, receipt, document services and closing layout.
- Credentials and screenshots remain excluded from Git. No credentials were printed or embedded in the video.

## Workflow accuracy and limits

This video presents existing saved synthetic records and unsubmitted forms. No application, document request, approval, payment, release, or database fixture was submitted or created by this task. Ordinary authentication/session/audit writes may occur through login. No Laravel source or configuration was edited.

The Registrar detail is an existing enrollment awaiting Cashier verification, followed by a separate approved enrollment. The GCash proof screenshot uses the alumni document wizard, explicitly labeled document payment. The receipt and student enrollment payment are separate verified examples. The public status lookup is shown as a form, not a newly retrieved result. No new applicant account is required for these public interfaces.

The current source retires pickup/claiming booking and directs collection of ready, payment-satisfied documents during office hours. The video follows that implementation rather than advertising new appointment booking.

Original synthesized sound effects now accompany shot entrances, chapter changes and closing/logo beats: 28 cues, with no third-party samples. Browser entrances alternate direction with eased scale and perspective, and workflow underlines draw on progressively. The generator and cue manifest are retained under scripts/generate-sfx.mjs and public/assets/audio. Narration and background music remain unconfigured. No uninterrupted human playback or listening review has been performed. Sampled visual review and decoder validation do not replace final audience review.

## Export

Official export succeeded: out/dtc-ems-official-demo.mp4. FFprobe confirms H.264, 1920 x 1080, 30/1 fps, 210.005 seconds (AAC container padding) and 6,300 video frames. File size: 79,099,192 bytes. The export includes AAC stereo sound effects. Decoded audio peak is 0.219 and RMS is 0.0094, confirming nonzero audio with headroom. Metadata is saved in out/official-media-metadata.json. A full FFmpeg decode using -xerror -c:v rawvideo -c:a pcm_s16le -f null - exited 0 without errors. The prior export had encoded samples reviewed at 01:23, 01:46 and 02:45. After the motion update, out/motion-review.png at frame 975 was rendered and visually reviewed. The bundled Remotion browser and two workers were used, with file-based logs in out/render-official.log. The earlier out/dtc-ems-review-draft.mp4 contains placeholders and should not be used as the populated final version.

Preview: npm run dev. Render again: npm run render. The official command first runs strict asset validation. Capture details are in CAPTURE_GUIDE.md; the verified narrative and audio guide are in STORYBOARD.md and NARRATION.md.

## Visual, motion and sound revision (November 27, 2026)

The notes above describe the earlier export. This revision replaces its browser motion and its 28 sound cues with 48 cues. It was checked with the timeline and shot-data script, a loudness measurement, and preview frames from a stand-in for Remotion using test images. ESLint, TypeScript, a real Remotion render, review against real captures, and a listening review have not been run.
