import { AbsoluteFill, Interactive, Sequence, useVideoConfig } from "remotion";
import {
  AnimatedText,
  BrowserFrame,
  SceneTransition,
  Workflow,
} from "../components/Motion";

export type Shot = {
  capture: string;
  label: string;
  caption: string;
  focus?: string;
  zoom?: number;
  spotlight?: { x: number; y: number; width: number; height: number };
};
export const FeatureScene = ({
  title,
  chapter,
  shots,
  steps,
  dark = false,
}: {
  title: string;
  chapter: string;
  shots: Shot[];
  steps: string[];
  dark?: boolean;
}) => {
  const { durationInFrames } = useVideoConfig();
  return (
    <SceneTransition duration={durationInFrames} dark={dark}>
      <Interactive.Div
        name="Chapter label"
        style={{
          position: "absolute",
          left: 110,
          top: 65,
          fontSize: 24,
          color: dark ? "#b5bdca" : "#596477",
        }}
      >
        {chapter}
      </Interactive.Div>
      <div style={{ position: "absolute", left: 110, top: 112, width: 1700 }}>
        <AnimatedText size={78}>{title}</AnimatedText>
      </div>
      {shots.map((shot, index) => {
        const start = Math.round((index * durationInFrames) / shots.length);
        const length =
          Math.round(((index + 1) * durationInFrames) / shots.length) - start;
        return (
          <Sequence
            key={`${shot.capture}-${index}`}
            name={shot.label}
            from={start}
            durationInFrames={length}
          >
            <div
              style={{
                position: "absolute",
                left: 384,
                top: 235,
                scale: "0.80",
                transformOrigin: "top left",
              }}
            >
              <BrowserFrame
                capture={shot.capture}
                label={shot.label}
                focus={shot.focus}
                zoom={shot.zoom ?? 1.08}
                tilt={index % 2 === 0}
                spotlight={shot.spotlight}
              />
            </div>
            <AbsoluteFill
              style={{
                justifyContent: "flex-end",
                alignItems: "center",
                paddingBottom: 94,
              }}
            >
              <AnimatedText size={40}>{shot.caption}</AnimatedText>
            </AbsoluteFill>
          </Sequence>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 110,
          bottom: 32,
          right: 110,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Workflow steps={steps} />
        <span style={{ fontSize: 22, color: dark ? "#b5bdca" : "#596477" }}>
          DTC EMS
        </span>
      </div>
    </SceneTransition>
  );
};
