import { Composition } from "remotion";
import { DTCEMSDemo } from "./DTCEMSDemo";
import { video } from "./config/timeline";

export const MyComposition = () => {
  return (
    <Composition
      id="DTCEMSDemo"
      component={DTCEMSDemo}
      durationInFrames={video.seconds * video.fps}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
