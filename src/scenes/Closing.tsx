import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import {
  AnimatedText,
  LogoReveal,
  SceneTransition,
} from "../components/Motion";
export const Closing = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <SceneTransition duration={durationInFrames} dark>
      <Sequence durationInFrames={11 * fps} name="Closing statements">
        <AbsoluteFill
          style={{ justifyContent: "center", paddingLeft: 180, gap: 24 }}
        >
          <AnimatedText size={100}>Less paperwork.</AnimatedText>
          <AnimatedText size={100} delay={2 * fps}>
            Clearer processes.
          </AnimatedText>
          <AnimatedText size={100} delay={4 * fps} color="#FFC72C">
            Connected services.
          </AnimatedText>
        </AbsoluteFill>
      </Sequence>
      <Sequence from={11 * fps} name="Institutional sign-off">
        <AbsoluteFill
          style={{ justifyContent: "center", alignItems: "center", gap: 30 }}
        >
          <LogoReveal size={155} />
          <AnimatedText size={125}>DTC EMS</AnimatedText>
          <AnimatedText size={38} delay={fps}>
            Danao Technological College
          </AnimatedText>
          <div style={{ height: 8 }} />
          <AnimatedText size={32} delay={2 * fps} color="#b7bfcb">
            Enrollment. Payments. Document Services.
          </AnimatedText>
        </AbsoluteFill>
      </Sequence>
    </SceneTransition>
  );
};
