# DTC EMS — Official System Demonstration

Editable Remotion 4.0.547 project for Danao Technological College. Eight scenes, 1920 × 1080, 30 fps, 210 seconds. Uses real reviewed application screenshots; missing captures are explicitly labeled placeholders.

```text
npm run dev
npm run sfx
npm run capture -- --public
npm run capture
npm run check
npm run render:draft
node scripts/validate-assets.mjs --strict
npm run render
```

On PowerShell systems that block npm.ps1/npx.ps1, use npm.cmd and npx.cmd.

- Composition: DTCEMSDemo at http://localhost:3000/DTCEMSDemo when Studio uses port 3000.
- Official output: out/dtc-ems-official-demo.mp4, H.264 / yuv420p; AAC when audio is supplied.
- Draft output while capture coverage is incomplete: out/dtc-ems-review-draft.mp4.
- Central timing and configurable total duration: src/config/timeline.ts.
- Independent audio sources and volumes: src/config/assets.ts. Empty sources render silently.
- Eight scene components: src/scenes/. Reusable motion: src/components/Motion.tsx.
- Official college seal and blue/gold colors come from the source application. No separate EMS logo was located.

Read [capture instructions](docs/CAPTURE_GUIDE.md), [verified storyboard](docs/STORYBOARD.md), and [timed narration](docs/NARRATION.md). The Laravel application is a read-only source; this project does not create demo records or bypass authentication.

New screenshots are excluded from Git and held behind review flags. Keep capture.local.json private. All 21 capture slots now have reviewed real interfaces from the user-confirmed synthetic dataset. Original synthesized whooshes and chimes accompany browser entrances, chapter changes and logo reveals. Narration and music remain unconfigured. Regenerate effects with `node scripts/generate-sfx.mjs`. See docs/VALIDATION.md for saved-state versus unsubmitted-form details.

## Editing shots and sound

- `src/config/shots.json`: captions, step labels and zoom focus. `focus.x` and `focus.y` (0 to 1) set the zoom anchor; `focus.zoom` is the final scale. The values are untuned starting points: check every shot against its real capture.
- `src/config/timeline.json`: scene timing. The intro, administration and closing cues have fixed offsets in the scene files and `scripts/generate-sfx.mjs`; change both together.
- Run `npm run sfx` after changing shots or timing.
- Captures are taken at 2x (3840 x 2160). Older 1x captures still validate, with a warning.

## Live demo pilot (real interaction recording)

1. Start the local app. In `capture.local.json`, use a synthetic alumni account and `syntheticDataOnly: true`.
2. `npm run record` records the document request wizard. It never submits, and blocks all writes except login.
3. Watch `public/assets/recordings/document-request.webm` for private data (ignored by Git).
4. `npm run dev`, then open the `LiveDemoPilot` composition. The camera follows each click, with click and key sounds.

## Full enrollment flow (real recording)

Records application → Registrar approval → account setup → enrollment → section assignment → Cashier payment → final approval → Certificate of Registration.

This flow creates and approves records, so it runs on a **separate demo database**, never your main one. Start MySQL first. In PowerShell, from this folder:

1. Create the demo database (once, or again to reset the demo passwords):

   ```powershell
   C:\php84\php.exe scripts\demo-db-setup.php C:\Users\JEREMY\centralized_enrollment_for_DTC
   ```

   It adds `.env.demo` to the app, creates `<your database>_demo`, and writes `demo.local.json`. Both files hold secrets: do not commit or share them. Use the PHP version your app requires.

2. In a second PowerShell window, serve the demo copy and leave it running:

   ```powershell
   cd C:\Users\JEREMY\centralized_enrollment_for_DTC
   $env:APP_ENV="demo"
   C:\php84\php.exe artisan serve --port=8000 --no-reload
   ```

   Use a window used only for the demo, because `APP_ENV` stays set until you close it. Stop your normal app first (Ctrl+C in its window), because the demo uses the same port.

3. Record, then preview:

   ```powershell
   npm run record:flow
   npm run dev
   ```

   Open the `FullFlowDemo` composition. Render it with `npx remotion render FullFlowDemo out/dtc-ems-full-flow.mp4`.

Before sharing, watch the video. Everything in it should be fictional.

The recorder signs in the generated demo staff accounts first. They exist only in the demo database, so if port 8000 is serving anything else it stops before creating records. The setup assigns plain class sections, so the video shows the Registrar assigning them; if your app publishes a timetable group instead, that step is skipped by the app and the recorder needs adjusting.

If a step fails, the terminal names it and saves `public/assets/recordings/flow/error-<step>.png`.
