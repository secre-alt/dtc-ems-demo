// Sounds and on-screen effects that follow the recorded clicks and typing.
import { Audio } from "@remotion/media";
import { Sequence, interpolate, staticFile } from "remotion";
import { theme } from "../config/theme";

export type SoundEvent = {
  type: "click" | "key" | "whoosh" | "success";
  time: number;
  space?: boolean;
};

const SOUNDS = {
  click: { frames: 6, volume: 0.75 },
  key: { frames: 5, volume: 0.7 },
  whoosh: { frames: 16, volume: 0.8 },
  success: { frames: 12, volume: 0.8 },
};

// The same frame must always pick the same key, so this is not random.
const keyNumber = (index: number) => ((index * 7 + (index >> 2)) % 4) + 1;

export const InteractionSounds = ({
  events,
  trim,
  fps,
}: {
  events: SoundEvent[];
  trim: number;
  fps: number;
}) => (
  <>
    {events.map((event, i) => {
      const from = Math.round((event.time - trim) * fps);
      if (from < 0) return null;
      const { frames, volume } = SOUNDS[event.type];
      const file =
        event.type !== "key"
          ? event.type
          : event.space
            ? "key-space"
            : `key-${keyNumber(i)}`;
      return (
        <Sequence key={i} from={from} durationInFrames={frames} layout="none">
          <Audio src={staticFile(`assets/audio/${file}.wav`)} volume={volume} />
        </Sequence>
      );
    })}
  </>
);

const ROWS = [10, 9, 7];

// A small keyboard that lights up while text is typed. It never shows which
// characters were typed, so passwords stay private.
export const TypingKeyboard = ({
  time,
  events,
}: {
  time: number;
  events: { type: string; time: number; x?: number; y?: number }[];
}) => {
  const keys = events.filter((event) => event.type === "key");
  // Fades in just before typing starts and out shortly after it stops.
  const opacity = Math.max(
    0,
    ...keys.map((key) =>
      interpolate(time - key.time, [-0.2, 0, 0.5, 0.75], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    ),
  );
  if (opacity === 0) return null;
  let pressed = -1;
  for (let i = 0; i < keys.length; i++) {
    const age = time - keys[i].time;
    if (age >= 0 && age < 0.09) pressed = i;
  }
  const total = ROWS.reduce((sum, count) => sum + count, 0);
  const lit = pressed < 0 ? -1 : (pressed * 11 + 3) % total;
  // Stay on the other side if the field being typed in is bottom right.
  const field = events
    .filter((event) => event.type === "click" && event.time <= time + 0.2)
    .at(-1);
  const left = (field?.x ?? 0) > 1250 && (field?.y ?? 0) > 700;
  let index = 0;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 32,
        [left ? "left" : "right"]: 40,
        padding: 16,
        borderRadius: 18,
        backgroundColor: theme.ink,
        opacity: opacity * 0.94,
        translate: `0px ${(1 - opacity) * 18}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
      }}
    >
      {ROWS.map((count) => (
        <div key={count} style={{ display: "flex", gap: 7 }}>
          {Array.from({ length: count }, () => {
            const on = index++ === lit;
            return (
              <div
                key={index}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  backgroundColor: on ? theme.gold : "#3a3e47",
                  translate: on ? "0px 2px" : "0px 0px",
                }}
              />
            );
          })}
        </div>
      ))}
      <div
        style={{
          width: 150,
          height: 18,
          borderRadius: 6,
          backgroundColor: "#3a3e47",
        }}
      />
    </div>
  );
};
