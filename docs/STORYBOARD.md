# DTC EMS — Official System Demonstration

1920 × 1080 · 30 fps · 210 seconds · eight scenes.

| Time        | Scene               | Direction and verified behavior                                                                                |
| ----------- | ------------------- | -------------------------------------------------------------------------------------------------------------- |
| 00:00–00:12 | Opening             | Official college seal, near-black stage, large typography, actual landing page.                                |
| 00:12–00:30 | Overview            | Pre-enrollment, student dashboard, document services. Three connected service areas.                           |
| 00:30–01:05 | Applicant & student | Application, status lookup, subject selection, enrollment tracking. Section assignment may precede payment.    |
| 01:05–01:35 | Registrar           | Dashboard, application search/review, section assignment, final paid enrollment review.                        |
| 01:35–02:05 | Payments            | Student payment details, GCash proof, Cashier review/walk-in processing, verified status/receipt.              |
| 02:05–02:40 | Documents           | Alumni dashboard, request form, progress, Registrar processing and collection. Appointment booking is retired. |
| 02:40–03:05 | Administration      | Administrator dashboard and editorial role relationship diagram. The diagram is not application UI.            |
| 03:05–03:30 | Closing             | Sequential statements, college seal, institutional sign-off and fade to near-black.                            |

## Read-only source verification — November 26, 2026

Application: `C:/Users/JEREMY/centralized_enrollment_for_DTC`, available at `http://127.0.0.1:8000`.

- `routes/web.php`: public application, role-scoped portal, Registrar, Cashier and Admin routes; proof verification and receipt endpoints.
- `Public/ApplicationController.php`, `resources/views/public/application/create.blade.php`: multi-step admission form and status lookup.
- `Student/EnrollmentController.php`, `Registrar/EnrollmentController.php`, `Registrar/ApplicationController.php`: subject selection, section-assignment hold, verified-payment gate, application review/approval/rejection and remarks.
- `Cashier/PaymentController.php`, `resources/views/student/enrollment/_payment-content.blade.php`, Cashier payment views: GCash proof, walk-in processing and receipts. Financial side effects are not exercised.
- `Alumni/DocumentRequestController.php`, `ClaimingAppointmentController.php`, `DocumentSubmissionService.php`, alumni create view: requests without appointments; retired pickup/claiming bookings; ready/payment-satisfied collection during office hours.
- `Registrar/DocumentRequestController.php`: submitted → processing → ready; physical collection controls release.
- `Admin/UserController.php`, `Admin/SettingsController.php`, admin dashboard view: role management, academic settings, dashboard.
- Models `Enrollment.php`, `Payment.php`, `DocumentRequest.php`: academic/payment states and relationships.
- `public/css/dtc-theme.css`: royal blue #0F4CDB, gold #FFC72C. `public/images/DTC-LOGO.png`: official college seal. No separate EMS logo was located.
- `docs/enrollment-workflow-acceptance.md`, `docs/portal-payment-pages.md`: workflow notes, cross-checked against code.

## Motion and editing

Frame-driven eased text reveals, staggered closing lines, damped browser entrance, perspective flattening, screenshot zoom, workflow emphasis and connecting lines. Cursor/click and spotlight components are available for precisely located reviewed actions; they are not placed over unknown interfaces.

Scene instances are authored individually in `src/DTCEMSDemo.tsx`. Shared shot presentation is intentionally template-driven in `FeatureScene.tsx`; edit shot order/content in its scene file. Central timings are in `src/config/timeline.ts`. Changing total duration scales chapter boundaries; narration requires retiming separately.

Every screenshot requires visual review. Missing/unreviewed screenshots remain explicitly labeled placeholders. A successful render with placeholders is a review draft, not accepted official output.

## Captured presentation

All 21 slots now have reviewed real interfaces. The Registrar detail shows an existing enrollment awaiting Cashier verification, followed by a separate already-approved record. No approval was executed. The GCash form is the alumni document-payment wizard, labeled as document payment. The student payment detail and Cashier receipt show saved verified examples. The application-status shot is the real public lookup form, not a fabricated result. No request or payment was submitted by the capture task.
