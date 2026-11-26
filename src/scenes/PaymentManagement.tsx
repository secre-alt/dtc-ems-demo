import { FeatureScene } from "./FeatureScene";
export const PaymentManagement = () => (
  <FeatureScene
    title="Payments, connected."
    chapter="Student & cashier"
    steps={["Submit", "Verify", "Confirm"]}
    shots={[
      {
        capture: "student-payment",
        label: "Student payment details",
        caption: "View enrollment payment details.",
      },
      {
        capture: "gcash-submit",
        label: "GCash document payment",
        caption: "Add a reference and payment proof.",
        zoom: 1.32,
        focus: "50% 100%",
      },
      {
        capture: "cashier-payments",
        label: "Cashier payment processing",
        caption: "Review GCash proof. Process walk-in payments.",
      },
      {
        capture: "payment-confirmation",
        label: "Verified payment and receipt",
        caption: "Verified status. Recorded receipt.",
      },
    ]}
  />
);
