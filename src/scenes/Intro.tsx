import { Sequence, useVideoConfig } from "remotion";
import {
  AnimatedText,
  LogoReveal,
  SceneTransition,
} from "../components/Motion";
import { ProductWindow, Screen } from "../components/ProductWindow";

export const Intro = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <SceneTransition duration={durationInFrames} dark>
      <div style={{ position: "absolute", left: 120, top: 210 }}>
        <LogoReveal size={120} />
      </div>
      <div style={{ position: "absolute", left: 120, top: 390 }}>
        <AnimatedText size={34} delay={fps / 3}>
          Danao Technological College
        </AnimatedText>
        <div style={{ height: 32 }} />
        <AnimatedText size={105} delay={fps * 0.6}>
          Introducing
          <br />
          DTC EMS.
        </AnimatedText>
      </div>
      <Sequence from={2 * fps} name="Landing page reveal">
        <div
          style={{
            position: "absolute",
            left: 840,
            top: 225,
            scale: ".72",
            transformOrigin: "top left",
          }}
        >
          <ProductWindow label="Welcome">
            <Screen
              capture="landing"
              label="Welcome"
              focus={{ x: 0.5, y: 0.3, zoom: 1.08 }}
            />
          </ProductWindow>
        </div>
      </Sequence>
    </SceneTransition>
  );
};
