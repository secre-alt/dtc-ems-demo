import React from "react";
import {
  AbsoluteFill,
  CanvasImage,
  Easing,
  Interactive,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
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
          [0, 34],
          ["0px 42px", "0px 0px"],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        ),
        scale: String(
          0.985 +
            0.015 * interpolate(frame - delay, [0, 34], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
        ),
      }}
    >
      {children}
    </Interactive.Div>
  );
};

// The background blends from the previous scene's color, so light and dark
// scenes never swap in a single frame. Content fades out before the cut.
export const SceneTransition = ({
  children,
  duration,
  dark = false,
  from,
}: {
  children: React.ReactNode;
  duration: number;
  dark?: boolean;
  from?: string;
}) => {
  const frame = useCurrentFrame();
  const target = dark ? theme.ink : theme.paper;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: interpolateColors(
          frame,
          [0, 18],
          [from ?? target, target],
        ),
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
            [0, 12, duration - 12, duration - 1],
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

// Fades its content out just before the enclosing Sequence ends.
export const FadeOut = ({ children }: { children: React.ReactNode }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        opacity: interpolate(
          frame,
          [durationInFrames - 12, durationInFrames - 1],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        ),
      }}
    >
      {children}
    </AbsoluteFill>
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

// The highlight follows the shot on screen, not an independent clock.
export const Workflow = ({
  steps,
  active,
  since,
}: {
  steps: string[];
  active: number;
  since: number;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
    {steps.map((step, i) => (
      <React.Fragment key={step}>
        {i > 0 && (
          <div style={{ width: 20, height: 1, backgroundColor: "#aab4c4" }} />
        )}
        <div
          style={{
            fontSize: 22,
            fontWeight: i === active ? 700 : 400,
            position: "relative",
            color: i <= active ? theme.ink : "#6b7586",
            paddingBottom: 9,
          }}
        >
          {step}
          <div
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              height: 3,
              width: "100%",
              backgroundColor: i === active ? theme.blue : "#9db4ee",
              transformOrigin: "left",
              scale: `${
                i < active
                  ? 1
                  : i > active
                    ? 0
                    : interpolate(since, [0, 22], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                        easing: Easing.bezier(0.16, 1, 0.3, 1),
                      })
              } 1`,
            }}
          />
        </div>
      </React.Fragment>
    ))}
  </div>
);

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
