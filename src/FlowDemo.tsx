import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Sequence,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "./config/theme";

const FPS = 30;
const ZOOM = 1.4;
const CARD = 66;
const FOLDER = "assets/recordings/flow";
const ease = Easing.bezier(0.45, 0, 0.1, 1);
const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Event = {
  type: "click" | "key" | "wide";
  time: number;
  x?: number;
  y?: number;
};
type Scene = {
  id: string;
  title: string;
  role: string;
  file: string;
  trim: number;
  end: number;
  events: Event[];
};
type Flow = { width: number; height: number; scenes: Scene[] };
export type FlowDemoProps = { flow: Flow | null };

// Stops just short of the last frame, so a clip never runs past its video.
const clipFrames = (scene: Scene) =>
  Math.floor((scene.end - scene.trim - 0.5) * FPS);

// The recordings are private and ignored by Git, so they load at run time.
export const flowDemoMetadata: CalculateMetadataFunction<
  FlowDemoProps
> = async () => {
  const response = await fetch(staticFile(`${FOLDER}/flow.json`));
  const flow: Flow | null = response.ok ? await response.json() : null;
  return {
    props: { flow },
    durationInFrames: flow
      ? flow.scenes.reduce((sum, scene) => sum + CARD + clipFrames(scene), 0)
      : 90,
  };
};

// Glides in shortly before each click and pulls back to show each result.
const camera = (time: number, events: Event[], flow: Flow) => {
  let state = { x: 0.5, y: 0.5, zoom: 1 };
  for (const event of events) {
    if (event.type === "key") continue;
    const click = event.type === "click";
    const p = interpolate(
      time,
      click
        ? [event.time - 0.9, event.time - 0.1]
        : [event.time, event.time + 0.8],
      [0, 1],
      { ...clamp, easing: ease },
    );
    const mix = (a: number, b: number) => a + (b - a) * p;
    state = {
      x: click ? mix(state.x, event.x! / flow.width) : state.x,
      y: click ? mix(state.y, event.y! / flow.height) : state.y,
      zoom: mix(state.zoom, click ? ZOOM : 1),
    };
  }
  return state;
};

const ChapterCard = ({
  scene,
  step,
  total,
}: {
  scene: Scene;
  step: number;
  total: number;
}) => {
  const frame = useCurrentFrame();
  const rise = interpolate(frame, [0, 18], [0, 1], { ...clamp, easing: ease });
  const opacity = interpolate(frame, [CARD - 8, CARD], [1, 0], clamp);
  return (
    <AbsoluteFill
      style={{ backgroundColor: theme.ink, fontFamily: theme.font }}
    >
      <Audio src={staticFile("assets/audio/chapter.wav")} volume={0.8} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          padding: "0 180px",
          opacity: rise * opacity,
          translate: `0px ${(1 - rise) * 28}px`,
          scale: String(0.985 + 0.015 * rise),
        }}
      >
        <div style={{ color: theme.gold, fontSize: 34, fontWeight: 700 }}>
          Step {step} of {total} · {scene.role}
        </div>
        <div
          style={{
            color: "#fff",
            fontSize: 84,
            fontWeight: 700,
            lineHeight: 1.12,
            marginTop: 24,
            maxWidth: 1400,
            opacity: interpolate(frame, [5, 20], [0, 1], { ...clamp }),
            translate: `0px ${interpolate(frame, [0, 22], [20, 0], { ...clamp, easing: ease })}px`,
          }}
        >
          {scene.title}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 56 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                width: 76,
                height: 8,
                borderRadius: 4,
                backgroundColor: i < step ? theme.blue : "#33363d",
              }}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Clip = ({ scene, flow }: { scene: Scene; flow: Flow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { x, y, zoom } = camera(scene.trim + frame / fps, scene.events, flow);
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", overflow: "hidden" }}>
      {/* An origin inside the frame never exposes an empty edge. */}
      <AbsoluteFill
        style={{ transformOrigin: `${x * 100}% ${y * 100}%`, scale: `${zoom}` }}
      >
        <Video
          src={staticFile(`${FOLDER}/${scene.file}`)}
          trimBefore={Math.round(scene.trim * fps)}
          muted
        />
      </AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: 32,
          padding: "14px 26px",
          borderRadius: 40,
          backgroundColor: theme.ink,
          color: "#fff",
          fontFamily: theme.font,
          fontSize: 26,
          fontWeight: 700,
          opacity: interpolate(frame, [0, 14], [0, 1], clamp),
          translate: `0px ${interpolate(frame, [0, 20], [10, 0], { ...clamp, easing: ease })}px`,
        }}
      >
        <span style={{ color: theme.gold }}>●</span> {scene.role}
      </div>
      {scene.events.map((event, i) => {
        const from = Math.round((event.time - scene.trim) * fps);
        return event.type === "wide" || from < 0 ? null : (
          <Sequence key={i} from={from} durationInFrames={4} layout="none">
            <Audio
              src={staticFile(`assets/audio/${event.type}.wav`)}
              volume={event.type === "click" ? 0.7 : 0.35}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const FlowDemo = ({ flow }: FlowDemoProps) => {
  if (!flow) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: theme.paper,
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.font,
          fontSize: 44,
        }}
      >
        No recording yet. Run: npm run record:flow
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill>
      <Series>
      {flow.scenes.flatMap((scene, i) => [
        <Series.Sequence key={`${scene.id}-card`} durationInFrames={CARD}>
          <ChapterCard scene={scene} step={i + 1} total={flow.scenes.length} />
        </Series.Sequence>,
        <Series.Sequence key={scene.id} durationInFrames={clipFrames(scene)}>
          <Clip scene={scene} flow={flow} />
        </Series.Sequence>,
      ])}
      </Series>
      <Audio src={staticFile("assets/audio/sound-design.wav")} volume={0.55} />
      <Audio src={staticFile("assets/audio/recording-effects.wav")} volume={0.28} />
    </AbsoluteFill>
  );
};
