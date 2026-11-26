import { Sequence, useVideoConfig } from "remotion";
import {
  AnimatedText,
  BrowserFrame,
  LogoReveal,
  SceneTransition,
} from "../components/Motion";
export const Intro = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <SceneTransition duration={durationInFrames} dark>
      <div style={{ position: "absolute", left: 120, top: 160 }}>
        <LogoReveal size={120} />
      </div>
      <div style={{ position: "absolute", left: 120, top: 340 }}>
        <AnimatedText size={34} delay={fps / 2}>
          Danao Technological College
        </AnimatedText>
        <div style={{ height: 32 }} />
        <AnimatedText size={105} delay={fps}>
          Introducing
          <br />
          DTC EMS.
        </AnimatedText>
      </div>
      <Sequence from={4 * fps} name="Landing page reveal">
        <div
          style={{
            position: "absolute",
            left: 855,
            top: 210,
            scale: ".72",
            transformOrigin: "top left",
          }}
        >
          <BrowserFrame capture="landing" label="Welcome" zoom={1.06} tilt />
        </div>
      </Sequence>
    </SceneTransition>
  );
};
