import { FeatureScene } from "./FeatureScene";
export const StudentExperience = () => (
  <FeatureScene
    title="Enrollment, simplified."
    chapter="Applicant & student"
    steps={["Apply", "Review", "Select subjects", "Track"]}
    shots={[
      {
        capture: "application",
        label: "Online application",
        caption: "Apply online.",
      },
      {
        capture: "application-status",
        label: "Application status",
        caption: "Follow your application.",
      },
      {
        capture: "enrollment-create",
        label: "Subject selection",
        caption: "Select subjects. Submit enrollment.",
      },
      {
        capture: "enrollment-status",
        label: "Enrollment progress",
        caption: "Track sections, payment, and final approval.",
      },
    ]}
  />
);
