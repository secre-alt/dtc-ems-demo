import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ProductWindow, SCREEN, Screen } from "../components/ProductWindow";
import { SceneTransition, Workflow } from "../components/Motion";
import shotData from "../config/shots.json";
import type { Box, Focus } from "../components/ProductWindow";
import { theme } from "../config/theme";

type Shot = {
  capture: string;
  label: string;
  caption: string;
  step: number;
  focus: Focus;
  spotlight?: Box;
  sound?: string;
};

const CROSSFADE = 16;

export const FeatureScene = ({
  scene,
  from = theme.paper,
}: {
  scene: keyof typeof shotData;
  from?: string;
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { chapter, title, steps } = shotData[scene];
  const shots: Shot[] = shotData[scene].shots;
  // scripts/generate-sfx.mjs uses the same formula to place its cues.
  const starts = shots.map((_, i) =>
    Math.round((i * durationInFrames) / shots.length),
  );
  const active = starts.filter((start) => frame >= start).length - 1;
  return (
    <SceneTransition duration={durationInFrames} from={from}>
      <div style={{ position: "absolute", left: 224, top: 34, fontSize: 23 }}>
        <span style={{ color: theme.blue, fontWeight: 700 }}>{chapter}</span>
        <span style={{ color: "#596477" }}> · {title}</span>
      </div>
      {shots.map((shot, i) => (
        <Sequence
          key={`caption-${i}`}
          name={`Caption: ${shot.label}`}
          from={starts[i]}
          durationInFrames={(starts[i + 1] ?? durationInFrames) - starts[i]}
        >
          <Caption>{shot.caption}</Caption>
        </Sequence>
      ))}
      <div style={{ position: "absolute", right: 224, top: 30 }}>
        <Workflow
          steps={steps}
          active={shots[active].step}
          since={
            frame -
            starts[shots.findIndex((s) => s.step === shots[active].step)]
          }
        />
      </div>
      <div style={{ position: "absolute", left: 224, top: 158 }}>
        <ProductWindow label={shots[active].label}>
          {shots.map((shot, i) => {
            const end = starts[i + 1] ?? durationInFrames;
            // Each screen stays under the next one until the crossfade ends.
            const tail = i === shots.length - 1 ? 0 : CROSSFADE;
            return (
              <Sequence
                key={`screen-${i}`}
                name={shot.label}
                from={starts[i]}
                durationInFrames={end - starts[i] + tail}
                width={SCREEN.width}
                height={SCREEN.height}
              >
                <FadeIn skip={i === 0}>
                  <Screen {...shot} />
                </FadeIn>
              </Sequence>
            );
          })}
        </ProductWindow>
      </div>
    </SceneTransition>
  );
};

const FadeIn = ({
  skip,
  children,
}: {
  skip: boolean;
  children: React.ReactNode;
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        opacity: skip
          ? 1
          : interpolate(frame, [0, CROSSFADE], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.45, 0, 0.55, 1),
            }),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Caption = ({ children }: { children: string }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const clamp = {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  // The old caption leaves before the next one arrives, so text never overlaps.
  const opacity = Math.min(
    interpolate(frame, [3, 18], [0, 1], clamp),
    interpolate(
      frame,
      [durationInFrames - 8, durationInFrames - 1],
      [1, 0],
      clamp,
    ),
  );
  const rise = interpolate(frame, [3, 26], [18, 0], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 224,
        top: 78,
        width: SCREEN.width,
        fontSize: 48,
        fontWeight: 700,
        letterSpacing: -1,
        whiteSpace: "nowrap",
        opacity,
        translate: `0px ${rise}px`,
      }}
    >
      {children}
    </div>
  );
};
