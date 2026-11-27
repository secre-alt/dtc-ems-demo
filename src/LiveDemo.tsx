import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { theme } from "./config/theme";

const FPS = 30;
const ZOOM = 1.45;
const SOURCE = "assets/recordings/document-request";

type Event = { type: "click" | "key"; time: number; x?: number; y?: number };
type Recording = {
  width: number;
  height: number;
  trim: number;
  end: number;
  events: Event[];
};
export type LiveDemoProps = { recording: Recording | null };

// The recording is private and ignored by Git, so it is loaded at run time.
export const liveDemoMetadata: CalculateMetadataFunction<
  LiveDemoProps
> = async () => {
  const response = await fetch(staticFile(`${SOURCE}.json`));
  const recording: Recording | null = response.ok
    ? await response.json()
    : null;
  return {
    props: { recording },
    durationInFrames: recording
      ? Math.ceil((recording.end - recording.trim) * FPS)
      : 90,
  };
};

// Camera: full screen first, then glide to each click shortly before it lands.
const camera = (time: number, { events, width, height }: Recording) => {
  let state = { x: 0.5, y: 0.5, zoom: 1 };
  for (const event of events) {
    if (event.type !== "click") continue;
    const p = interpolate(time, [event.time - 0.9, event.time - 0.1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.45, 0, 0.1, 1),
    });
    const mix = (a: number, b: number) => a + (b - a) * p;
    state = {
      x: mix(state.x, event.x! / width),
      y: mix(state.y, event.y! / height),
      zoom: mix(state.zoom, ZOOM),
    };
  }
  return state;
};

export const LiveDemo = ({ recording }: LiveDemoProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!recording) {
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
        No recording yet. Run: npm run record
      </AbsoluteFill>
    );
  }
  const { x, y, zoom } = camera(recording.trim + frame / fps, recording);
  return (
    <AbsoluteFill style={{ backgroundColor: "#fff", overflow: "hidden" }}>
      {/* An origin inside the frame never exposes an empty edge. */}
      <AbsoluteFill
        style={{ transformOrigin: `${x * 100}% ${y * 100}%`, scale: `${zoom}` }}
      >
        <Video
          src={staticFile(`${SOURCE}.webm`)}
          trimBefore={Math.round(recording.trim * fps)}
          muted
        />
      </AbsoluteFill>
      {recording.events.map((event, i) => {
        const from = Math.round((event.time - recording.trim) * fps);
        return from < 0 ? null : (
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
