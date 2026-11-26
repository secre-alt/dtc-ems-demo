# Real application capture

Keep the Laravel application unchanged. Do not seed, migrate, reset, create users, submit applications, approve requests or execute payments. Screenshots need no record creation; normal login/session/audit writes can occur through authentication.

## Local access

`capture.local.json` is ignored by Git. Copy `capture.example.json` there if needed. Set `syntheticDataOnly:true` only after confirming all visible records in each demo account are fictional. Fill credentials locally, never in chat/source control. Seeded administrator credentials are not assumed to be demo authorization.

- `npm run capture -- --public`: public pages only.
- `npm run capture`: configured synthetic accounts.
- `npm run capture -- --manual`: normal manual login in Edge; press Enter in the terminal after signing into each role. Complete security controls normally.

Playwright uses installed Microsoft Edge, 1920 × 1080, en-US, Asia/Manila, reduced motion. No passwords, cookies, session state, HTML dumps or traces are saved. GET/HEAD requests and ordinary `/login` POST are permitted; other mutations are blocked.

## Individual states

Default shots cover landing/sign-in/application/status forms, role dashboards, enrollment selection/status, Registrar applications/enrollments/documents, Cashier payments, alumni request creation/history. They navigate only and do not create before/after states.

After preparing fictional states yourself, add read-only URLs in local `extraShots`, using actual synthetic IDs:

```json
{
  "id": "student-payment",
  "role": "student",
  "path": "/portal/enrollment/123/payment-info",
  "readySelector": ".content"
}
```

Additional storyboard IDs: `student-payment`, `gcash-submit`, `enrollment-approval`, `payment-confirmation`. Capture actual matching states. Use final list URLs with `?review=ID` for detail routes that redirect into Registrar/Cashier review dialogs; unexpected redirects are rejected. Prefer a ready selector targeting the open dialog.

`application-status` defaults to the public lookup form, not a populated application result. Use an authorized synthetic portal application page for a result capture. Never submit actual personal information.

## Review

New screenshots in `public/assets/screenshots/` are held behind `reviewed:false` in `public/assets/capture-manifest.json`. Known GCash account/QR blocks are hidden, but this is not comprehensive redaction. Inspect every image for real names, IDs, contact details, notifications, financial records, QR codes and debug panels. Re-capture/mask before approval. Enable only inspected images:

```text
node scripts/validate-assets.mjs --approve=landing,login,application,application-status
```

`npm run validate-assets` checks PNG signatures, dimensions, paths and required shot coverage. Add `--strict` directly to the validation script to fail on missing shots. Re-capture resets the review flag. Never approve uninspected protected captures.

## Render

`npm run check` runs lint, TypeScript, timeline and available-asset validation. After strict validation and visual review, `npm run render` writes the official file. During blocked capture coverage, use an explicit draft name:

```text
npx remotion render DTCEMSDemo out/dtc-ems-review-draft.mp4 --codec=h264 --pixel-format=yuv420p
npx remotion render DTCEMSDemo out/qa --frames=180,600,1350,2400,3300,4200,5100,6000 --image-format=png
```

Inspect every shot, transitions and full playback before accepting the official export. See the storyboard and narration guide for verified workflow details and local audio placement.

If the terminal renderer fails with `EPIPE`, run `npm run render:draft`. This uses file-based logs in `out/render-draft.log`, a hidden child process and two render workers; it produced the review export successfully in this workspace.

## Current configured captures

All five roles have authenticated normally after user confirmation of synthetic data. Extra URLs in the private configuration target an existing Registrar review, an approved enrollment, a student payment detail and a verified receipt. These are separate saved examples, not a newly executed transaction.

The GCash shot uses the alumni document wizard: select a document, enter a fictional purpose, advance to Payment, select GCash and enter DEMO-REFERENCE-ONLY. No proof file is fabricated or uploaded; the request is never submitted. Account/QR areas are hidden before capture and the page scrolls to the proof fields.

Recapture selected shots with npm run capture -- --only=student-dashboard,admin-dashboard. Extra shot IDs override matching default IDs; every new image still needs visual review. The application's external fonts/icons/charts must be allowed to load for complete captures.

Both npm render commands use scripts/render.mjs with file-based logs. The official command validates all assets first and writes out/render-official.log.
