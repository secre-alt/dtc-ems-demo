import { FeatureScene } from "./FeatureScene";
export const RegistrarExperience = () => (
  <FeatureScene
    title="Built for better administration."
    chapter="Registrar workspace"
    dark
    steps={["Review", "Verify", "Approve"]}
    shots={[
      {
        capture: "registrar-dashboard",
        label: "Registrar dashboard",
        caption: "See the work ahead.",
      },
      {
        capture: "applications",
        label: "Application management",
        caption: "Find submissions. Review the details.",
      },
      {
        capture: "enrollment-review",
        label: "Enrollment review",
        caption: "Check subjects and payment readiness.",
        spotlight: { x: 545, y: 298, width: 535, height: 65 },
      },
      {
        capture: "enrollment-approval",
        label: "Approved enrollment record",
        caption: "Payment verified. Academic decision recorded.",
      },
    ]}
  />
);
