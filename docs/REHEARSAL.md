# Stageshow rehearsal — November 27, 2026

Applied skill: ../.agents/skills/stageshow/SKILL.md (benjitaylor/skills, Stageshow 1.1.1).

Reference examples: `close-up` for larger focal controls within real screen context; `payout-flow` for quiet arrivals and reading holds. These are design references, not copied interface components. The film's real-capture and deterministic Remotion requirements take precedence over the kit's authored faux UI and wall-clock Stage/Act runtime.

Changes: removed the competing long header title; tuned application, lookup, subject-selection, GCash and receipt camera framing; slowed the camera settle to frame 96; shortened collection copy. Reviewed all 21 refreshed 3840 × 2160 captures and set their review flags only after inspection. The current Registrar review image shows an enrolled-and-paid record, so its outdated payment-gate spotlight was removed and its caption now describes selected subjects. Regenerated 47 original synthesized sound cues.

Reviewed actual Remotion frames under `out/stageshow-frames`: 916, 975, 1535, 1585, 3105, 3165, 3555, 3600, 4650. The application controls, selected subjects, GCash reference/upload fields, receipt and collection information are visible. Receipt title, amount and print action stay whole. The close-ups crop surrounding navigation/help content; focal controls remain inside the frame. The full screenshot is established before the camera moves, and the settled view holds for reading.

Checks passed: ESLint, TypeScript, contiguous 210-second timeline, shot focus/step data, strict 21/21 PNG asset and review validation. The sound generator validates cue bounds and normalizes the stem to -6 dBFS.

Limitations: no mobile version was requested for this fixed 1920 × 1080 film. Stageshow's DOM `--gate` and gold preview runtime were not run; they cannot validate these Remotion sequences. No independent reviewer, uninterrupted audience playback or listening review has been performed. Do not describe this as a Stageshow gate pass.

Export verification is recorded in VALIDATION.md after rendering completes.
