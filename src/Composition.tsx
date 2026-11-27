import { Composition } from "remotion";
import { DTCEMSDemo } from "./DTCEMSDemo";
import { video } from "./config/timeline";
import { LiveDemo, liveDemoMetadata } from "./LiveDemo";

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="DTCEMSDemo"
        component={DTCEMSDemo}
        durationInFrames={video.seconds * video.fps}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="LiveDemoPilot"
        component={LiveDemo}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ recording: null }}
        calculateMetadata={liveDemoMetadata}
      />
    </>
  );
};
