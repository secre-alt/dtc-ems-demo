import React from "react";
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Interactive,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { captures } from "../config/assets";
import { theme } from "../config/theme";

export const AnimatedText = ({
  children,
  delay = 0,
  size = 88,
  color = "inherit",
}: {
  children: React.ReactNode;
  delay?: number;
  size?: number;
  color?: string;
}) => {
  const frame = useCurrentFrame();
  return (
    <Interactive.Div
      name="Typography reveal"
      style={{
        fontSize: size,
        color,
        fontWeight: 600,
        letterSpacing: size >= 72 ? -3 : -0.6,
        lineHeight: 1.06,
        opacity: interpolate(frame - delay, [0, 25], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: interpolate(
          frame - delay,
          [0, 32],
          ["0px 34px", "0px 0px"],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        ),
      }}
    >
      {children}
    </Interactive.Div>
  );
};

export const SceneTransition = ({
  children,
  duration,
  dark = false,
}: {
  children: React.ReactNode;
  duration: number;
  dark?: boolean;
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: dark ? theme.ink : theme.paper,
        color: dark ? "#fff" : theme.ink,
        fontFamily: theme.font,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: interpolate(
            frame,
            [0, 14, duration - 15, duration - 1],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const LogoReveal = ({ size = 120 }: { size?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <CanvasImage
      src={staticFile("assets/branding/DTC-LOGO.png")}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        opacity: interpolate(frame, [0, 24], [0, 1], {
          extrapolateRight: "clamp",
        }),
        scale: 0.94 + 0.06 * spring({ frame, fps, config: { damping: 200 } }),
      }}
    />
  );
};

export const BrowserFrame = ({
  capture,
  label,
  zoom = 1,
  focus = "center",
  tilt = false,
  spotlight,
}: {
  capture: string;
  label: string;
  zoom?: number;
  focus?: string;
  tilt?: boolean;
  spotlight?: { x: number; y: number; width: number; height: number };
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const asset = captures[capture]?.reviewed ? captures[capture] : undefined;
  return (
    <div
      style={{
        width: 1440,
        height: 810 + 46,
        borderRadius: 18,
        backgroundColor: "#fff",
        overflow: "hidden",
        boxShadow: "0 36px 80px #00000026",
        border: "1px solid #80808030",
        transform: tilt
          ? `perspective(2600px) rotateY(${interpolate(frame, [0, 50], [-7, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) })}deg)`
          : undefined,
        scale: interpolate(frame, [0, 42], [0.96, 1], {
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: `${interpolate(frame, [0, 42], [tilt ? 70 : -45, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) })}px ${interpolate(frame, [0, 42], [50, 0], { extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) })}px`,
      }}
    >
      <div
        style={{
          height: 46,
          backgroundColor: "#eceef1",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 9,
          color: "#58616d",
          fontSize: 16,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#b8bec7",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#b8bec7",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#b8bec7",
          }}
        />
        <span style={{ margin: "auto" }}>DTC EMS / {label}</span>
        <span style={{ width: 30 }} />
      </div>
      <div
        style={{
          position: "relative",
          height: 810,
          overflow: "hidden",
          color: theme.ink,
        }}
      >
        {asset ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              transformOrigin: focus,
              scale: interpolate(frame, [0, durationInFrames], [1, zoom], {
                extrapolateRight: "clamp",
              }),
            }}
          >
            <CanvasImage
              src={staticFile(asset.file)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {spotlight && (
              <Sequence
                from={60}
                durationInFrames={120}
                name="Review detail spotlight"
              >
                <FeatureSpotlight {...spotlight} />
              </Sequence>
            )}
          </div>
        ) : (
          <AbsoluteFill
            style={{
              backgroundColor: "#eef1f6",
              alignItems: "center",
              justifyContent: "center",
              gap: 25,
            }}
          >
            <div
              style={{ width: 70, height: 4, backgroundColor: theme.blue }}
            />
            <div style={{ fontSize: 46, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 28, color: "#5c6675" }}>
              Capture pending · authenticated demo access required
            </div>
            <div style={{ fontSize: 23, color: "#5c6675" }}>
              Temporary placeholder — not a system interface
            </div>
          </AbsoluteFill>
        )}
      </div>
    </div>
  );
};

export const FeatureSpotlight = ({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        border: `3px solid ${theme.blue}`,
        borderRadius: 12,
        boxShadow: "0 0 0 2000px #00000030",
        opacity: interpolate(frame, [0, 18, 100, 120], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }}
    />
  );
};

export const Cursor = ({
  from,
  to,
}: {
  from: [number, number];
  to: [number, number];
}) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 40], [from[0], to[0]], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  const y = interpolate(frame, [0, 40], [from[1], to[1]], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });
  return (
    <div style={{ position: "absolute", left: x, top: y }}>
      <svg width="30" height="36" viewBox="0 0 30 36">
        <path
          d="M2 2L2 29L9 22L15 34L21 31L15 20L27 20Z"
          fill="#141820"
          stroke="white"
          strokeWidth="2"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: -15,
          top: -15,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: `3px solid ${theme.blue}`,
          opacity: interpolate(frame, [40, 45, 62], [0, 0.8, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: interpolate(frame, [40, 62], [0.4, 1.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
    </div>
  );
};

export const Workflow = ({ steps }: { steps: string[] }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const active = Math.min(
    steps.length - 1,
    Math.floor((frame / durationInFrames) * steps.length),
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      {steps.map((step, i) => (
        <React.Fragment key={step}>
          {i > 0 && (
            <div style={{ width: 32, height: 1, backgroundColor: "#8290a4" }} />
          )}
          <div
            style={{
              fontSize: 27,
              position: "relative",
              color: i <= active ? "inherit" : "#87909e",
              borderBottom: "3px solid transparent",
              paddingBottom: 12,
            }}
          >
            {step}
            <div
              style={{
                position: "absolute",
                left: 0,
                bottom: -3,
                height: 3,
                width: "100%",
                backgroundColor: theme.blue,
                transformOrigin: "left",
                scale: `${interpolate(frame - (i * durationInFrames) / steps.length, [0, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) })} 1`,
              }}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

// Use with a clipped, reviewed capture; distance must stay inside its image bounds.
export const ScrollSimulation = ({
  children,
  distance = 40,
}: {
  children: React.ReactNode;
  distance?: number;
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div
      style={{
        translate: `0px ${interpolate(frame, [0, durationInFrames - 1], [0, -distance], { extrapolateRight: "clamp", easing: Easing.bezier(0.4, 0, 0.2, 1) })}px`,
      }}
    >
      {children}
    </div>
  );
};

// Wrap cropped dashboard imagery, never a recreated application card.
export const DashboardCardReveal = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        opacity: interpolate(frame - delay, [0, 20], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
        translate: `0px ${24 * (1 - spring({ frame: frame - delay, fps, config: { damping: 200 } }))}px`,
      }}
    >
      {children}
    </div>
  );
};
