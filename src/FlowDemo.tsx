import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Series,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  InteractionSounds,
  SoundEvent,
  TypingKeyboard,
} from "./components/Interaction";
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
  space?: boolean;
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

// A page change gets a whoosh. The last one is the step's result, so it gets
// the success sound instead.
const soundsFor = (events: Event[]) => {
  const done = events.filter((event) => event.type === "wide").at(-1);
  const sounds: SoundEvent[] = events.map((event) => ({
    // A whoosh is loudest in its middle. This puts that on the fastest part of
    // the camera's pull back.
    time:
      event.type === "wide" && event !== done ? event.time + 0.08 : event.time,
    space: event.space,
    type:
      event.type !== "wide"
        ? event.type
        : event === done
          ? "success"
          : "whoosh",
  }));
  return { sounds, done: done?.time ?? null };
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
  const opacity = interpolate(frame, [CARD - 10, CARD], [1, 0], clamp);
  const leave = interpolate(frame, [CARD - 10, CARD], [0, -24], {
    ...clamp,
    easing: ease,
  });
  const fill = interpolate(frame, [14, 40], [0, 1], {
    ...clamp,
    easing: ease,
  });
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
          translate: `0px ${(1 - rise) * 28 + leave}px`,
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
                overflow: "hidden",
                backgroundColor: "#33363d",
                // The bars arrive one after another.
                opacity: interpolate(
                  frame,
                  [6 + i * 2, 14 + i * 2],
                  [0, 1],
                  clamp,
                ),
              }}
            >
              <div
                style={{
                  height: "100%",
                  // Finished steps are full. The new one fills in view.
                  width: `${(i < step - 1 ? 1 : i === step - 1 ? fill : 0) * 100}%`,
                  backgroundColor: theme.blue,
                }}
              />
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Clip = ({ scene, flow }: { scene: Scene; flow: Flow }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = scene.trim + frame / fps;
  const { x, y, zoom } = camera(time, scene.events, flow);
  const { sounds, done } = soundsFor(scene.events);
  const complete = done !== null && time >= done;
  const landed = complete
    ? interpolate(time - done, [0, 0.35], [0, 1], {
        ...clamp,
        easing: Easing.bezier(0.25, 0.8, 0.25, 1),
      })
    : 1;
  const progress = interpolate(
    frame,
    [0, clipFrames(scene) - 1],
    [0, 1],
    clamp,
  );
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
        <span
          style={{
            display: "inline-block",
            color: complete ? "#4ade80" : theme.gold,
            scale: String(1 + (1 - landed) * 0.7),
          }}
        >
          {complete ? "✓" : "●"}
        </span>{" "}
        {scene.role}
        {complete ? " · Step complete" : ""}
      </div>
      {/* How far through this step the video is. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          height: 6,
          width: `${progress * 100}%`,
          backgroundColor: theme.blue,
        }}
      />
      <TypingKeyboard time={time} events={scene.events} />
      <InteractionSounds events={sounds} trim={scene.trim} fps={fps} />
      {/* Eases from the chapter card into the recording. */}
      <AbsoluteFill
        style={{
          backgroundColor: theme.ink,
          opacity: interpolate(frame, [0, 10], [1, 0], clamp),
          pointerEvents: "none",
        }}
      />
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
  );
};
