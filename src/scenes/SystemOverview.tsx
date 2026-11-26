import { FeatureScene } from "./FeatureScene";
export const SystemOverview = () => {
  return (
    <FeatureScene
      title="One system. Connected services."
      chapter="The platform"
      steps={["Enrollment", "Payments", "Document Services"]}
      shots={[
        {
          capture: "application",
          label: "Online pre-enrollment",
          caption: "A connected beginning.",
        },
        {
          capture: "student-dashboard",
          label: "Student dashboard",
          caption: "Your next step, in view.",
        },
        {
          capture: "document-form",
          label: "Document services",
          caption: "Support beyond enrollment.",
        },
      ]}
    />
  );
};
