import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { captures } from "../config/assets";
import { theme } from "../config/theme";

export const SCREEN = { width: 1472, height: 828, bar: 40 };

export type Focus = { x: number; y: number; zoom: number };
export type Box = { x: number; y: number; width: number; height: number };

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const glide = Easing.bezier(0.45, 0, 0.1, 1);
const arrive = Easing.bezier(0.25, 0.8, 0.25, 1);

// One screenshot: shown whole first, then eased toward its focus point.
// The zoom anchor stays inside the image, so no empty edge can appear.
export const Screen = ({
  capture,
  label,
  focus,
  spotlight,
}: {
  capture: string;
  label: string;
  focus: Focus;
  spotlight?: Box;
}) => {
  const frame = useCurrentFrame();
  const asset = captures[capture]?.reviewed ? captures[capture] : undefined;
  if (!asset) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#eef1f6",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div style={{ width: 70, height: 4, backgroundColor: theme.blue }} />
        <div style={{ fontSize: 46, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 28, color: "#5c6675" }}>
          Capture pending · authenticated demo access required
        </div>
        <div style={{ fontSize: 23, color: "#5c6675" }}>
          Temporary placeholder — not a system interface
        </div>
      </AbsoluteFill>
    );
  }
  const push = interpolate(frame, [30, 96], [0, 1], {
    ...clamp,
    easing: glide,
  });
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#fff" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
          scale: String(1 + (focus.zoom - 1) * push),
        }}
      >
        <CanvasImage
          src={staticFile(asset.file)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        {spotlight && (
          <Sequence
            from={90}
            durationInFrames={110}
            name="Review detail spotlight"
          >
            <Spotlight {...spotlight} />
          </Sequence>
        )}
      </div>
    </AbsoluteFill>
  );
};

const Spotlight = ({ x, y, width, height }: Box) => {
  const frame = useCurrentFrame();
  const settle = interpolate(frame, [0, 24], [14, 0], {
    ...clamp,
    easing: arrive,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: x * SCREEN.width - settle,
        top: y * SCREEN.height - settle,
        width: width * SCREEN.width + settle * 2,
        height: height * SCREEN.height + settle * 2,
        borderRadius: 12,
        boxShadow: "0 0 0 2000px #0b122055",
        opacity: interpolate(frame, [0, 18, 90, 110], [0, 1, 1, 0], clamp),
      }}
    />
  );
};

// The window chrome. It enters once; screens change inside it.
export const ProductWindow = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 32], [0, 1], {
    ...clamp,
    easing: arrive,
  });
  return (
    <div
      style={{
        width: SCREEN.width,
        height: SCREEN.height + SCREEN.bar,
        borderRadius: 16,
        backgroundColor: "#fff",
        overflow: "hidden",
        boxShadow: "0 2px 6px #0b122014, 0 30px 70px #0b122026",
        outline: "1px solid #0b12201a",
        opacity: interpolate(frame, [0, 14], [0, 1], clamp),
        translate: `0px ${(1 - enter) * 46}px`,
        scale: String(0.975 + 0.025 * enter),
      }}
    >
      <div
        style={{
          height: SCREEN.bar,
          backgroundColor: "#eef0f4",
          borderBottom: "1px solid #0b122012",
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          gap: 8,
          color: "#4d5767",
          fontSize: 16,
        }}
      >
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            style={{
              width: 11,
              height: 11,
              borderRadius: "50%",
              backgroundColor: "#c3c9d2",
            }}
          />
        ))}
        <span style={{ margin: "auto" }}>DTC EMS / {label}</span>
        <span style={{ width: 49 }} />
      </div>
      <div
        style={{
          position: "relative",
          height: SCREEN.height,
          overflow: "hidden",
          color: theme.ink,
        }}
      >
        {children}
      </div>
    </div>
  );
};
