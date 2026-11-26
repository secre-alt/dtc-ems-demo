# Timed narration guide

The video includes original synthesized transition whooshes and soft chimes. No voice-over or background music is configured. Record a calm, natural voice and leave space for the interfaces.

| Placement   | Voice-over                                                                                                                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00:01–00:10 | Introducing DTC EMS. A centralized platform designed to connect enrollment, payments, and document services at Danao Technological College.                                                                                                                                 |
| 00:13–00:27 | One system. Connected services. From an applicant's first submission to a graduate's document request, DTC EMS brings essential services into a shared institutional platform. Each role has a workspace for the next step.                                                 |
| 00:32–00:43 | Begin with the online application. Follow the guided steps, provide the required information, and review your details before submitting. Use the application status page to follow the review.                                                                              |
| 00:46–01:01 | Eligible students can select subjects and submit enrollment. When sections still need assignment, the Registrar completes that step before payment. Enrollment status keeps the next action visible, through payment verification and final review.                         |
| 01:07–01:19 | For the Registrar, submitted applications arrive in one workspace. Search and filter the list, inspect applicant information, and review the supporting details. Approve an application, request revisions, or explain a rejection.                                         |
| 01:21–01:31 | Enrollment review connects subject assignments with verified payment. The Registrar can examine the selected subjects, provide feedback, and record the academic decision.                                                                                                  |
| 01:37–01:49 | Payments stay connected to institutional services. View recorded enrollment payments. For document requests, choose GCash and add a reference and payment proof. The Cashier verifies payment before confirmation.                                                          |
| 01:51–02:01 | Walk-in payments are processed through the Cashier workspace. Verified payment status and receipt information provide a record of the transaction.                                                                                                                          |
| 02:07–02:19 | Document services continue beyond enrollment. Students and alumni can choose documents, specify copies, and arrange payment through the request form. Each payable document follows its verification process.                                                               |
| 02:21–02:35 | Follow progress while the Registrar prepares the request. When documents are ready and payment requirements are satisfied, collect them during published office hours. The current workflow does not require an appointment. Physical release is recorded by the Registrar. |
| 02:42–02:52 | Behind these services, the Administrator manages users and academic configuration. Role-based workspaces connect students, alumni, the Registrar, and the Cashier to the same institutional processes.                                                                      |
| 02:54–03:02 | Every role contributes its part. Applications, enrollment decisions, payments, and document requests remain connected within DTC EMS.                                                                                                                                       |
| 03:07–03:14 | Less paperwork. Clearer processes. Connected services.                                                                                                                                                                                                                      |
| 03:17–03:27 | From enrollment to document services, DTC EMS brings essential institutional processes together in one connected platform. Danao Technological College.                                                                                                                     |

## Add audio

1. Assemble passages into a 210-second track with silence between passages, starting at timeline zero.
2. Save as `public/assets/audio/narration.wav`.
3. Set `audio.narration.src` to `assets/audio/narration.wav` in `src/config/assets.ts`.
4. Add only licensed/original music and effects, recording attribution in `public/assets/audio/LICENSES.txt`. Configure sources and volumes independently in the same config file. Effects should be a pre-aligned stem starting at zero.
5. Check timing and mix in Studio. Retiming is needed if the duration changes. Suggested volumes are starting points, not measured loudness guarantees.

AAC is encoded from the sound-effects stem. Regenerate the original 28-cue stem with `node scripts/generate-sfx.mjs`; its cue list and provenance are in `public/assets/audio/cues.json`. Synthesis validates duration, finite samples and peak headroom. The effects volume is independent of optional narration and music.
