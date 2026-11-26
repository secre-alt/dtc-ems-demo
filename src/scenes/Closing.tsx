import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  AnimatedText,
  FadeOut,
  LogoReveal,
  SceneTransition,
} from "../components/Motion";
export const Closing = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <SceneTransition duration={durationInFrames} dark from="#F5F7FA">
      <Sequence durationInFrames={11 * fps} name="Closing statements">
        <FadeOut>
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
        </FadeOut>
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
          <Rule delay={Math.round(1.5 * fps)} />
          <AnimatedText size={32} delay={2 * fps} color="#b7bfcb">
            Enrollment. Payments. Document Services.
          </AnimatedText>
        </AbsoluteFill>
      </Sequence>
    </SceneTransition>
  );
};

const Rule = ({ delay }: { delay: number }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        width: interpolate(frame - delay, [0, 36], [0, 420], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.45, 0, 0.1, 1),
        }),
        height: 4,
        backgroundColor: "#FFC72C",
      }}
    />
  );
};
