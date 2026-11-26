import { AbsoluteFill, Sequence } from "remotion";
import { Audio } from "@remotion/media";
import { staticFile } from "remotion";
import { audio } from "./config/assets";
import { timing } from "./config/timeline";
import { Intro } from "./scenes/Intro";
import { SystemOverview } from "./scenes/SystemOverview";
import { StudentExperience } from "./scenes/StudentExperience";
import { RegistrarExperience } from "./scenes/RegistrarExperience";
import { PaymentManagement } from "./scenes/PaymentManagement";
import { DocumentServices } from "./scenes/DocumentServices";
import { Administration } from "./scenes/Administration";
import { Closing } from "./scenes/Closing";
export const DTCEMSDemo = () => (
  <AbsoluteFill style={{ backgroundColor: "#101114" }}>
    <Sequence name="01 Opening" {...timing("intro")}>
      <Intro />
    </Sequence>
    <Sequence name="02 Connected services" {...timing("overview")}>
      <SystemOverview />
    </Sequence>
    <Sequence name="03 Applicant and student" {...timing("student")}>
      <StudentExperience />
    </Sequence>
    <Sequence name="04 Registrar" {...timing("registrar")}>
      <RegistrarExperience />
    </Sequence>
    <Sequence name="05 Payments" {...timing("payments")}>
      <PaymentManagement />
    </Sequence>
    <Sequence name="06 Documents" {...timing("documents")}>
      <DocumentServices />
    </Sequence>
    <Sequence name="07 Administration" {...timing("administration")}>
      <Administration />
    </Sequence>
    <Sequence name="08 Closing" {...timing("closing")}>
      <Closing />
    </Sequence>
    {audio.music.src && (
      <Audio src={staticFile(audio.music.src)} volume={audio.music.volume} />
    )}
    {audio.narration.src && (
      <Audio
        src={staticFile(audio.narration.src)}
        volume={audio.narration.volume}
      />
    )}
    {audio.effects.src && (
      <Audio
        src={staticFile(audio.effects.src)}
        volume={audio.effects.volume}
      />
    )}
  </AbsoluteFill>
);
