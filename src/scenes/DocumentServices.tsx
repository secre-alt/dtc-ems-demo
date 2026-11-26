import { FeatureScene } from "./FeatureScene";
export const DocumentServices = () => (
  <FeatureScene
    title="Document services. Made accessible."
    chapter="Student & alumni services"
    dark
    steps={["Request", "Payment", "Preparation", "Collection"]}
    shots={[
      {
        capture: "alumni-dashboard",
        label: "Alumni dashboard",
        caption: "Essential services, still connected.",
      },
      {
        capture: "document-form",
        label: "Document request form",
        caption: "Choose documents. Arrange payment.",
      },
      {
        capture: "document-status",
        label: "Document request progress",
        caption: "Stay informed as requests progress.",
      },
      {
        capture: "registrar-documents",
        label: "Registrar document management",
        caption: "Preparation, readiness, and physical release.",
      },
      {
        capture: "document-status",
        label: "Collection information",
        caption:
          "Collect ready, payment-satisfied documents during office hours.",
      },
    ]}
  />
);
