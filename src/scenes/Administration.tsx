import {
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  AnimatedText,
  FadeOut,
  SceneTransition,
} from "../components/Motion";
import { ProductWindow, Screen } from "../components/ProductWindow";
import { theme } from "../config/theme";
export const Administration = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <SceneTransition duration={durationInFrames}>
      <div style={{ position: "absolute", left: 110, top: 95 }}>
        <AnimatedText size={88}>Everything works together.</AnimatedText>
      </div>
      <Sequence durationInFrames={10 * fps} name="Administrator dashboard">
        <FadeOut>
          <div
            style={{
              position: "absolute",
              left: 371,
              top: 220,
              scale: ".80",
              transformOrigin: "top left",
            }}
          >
            <ProductWindow label="Administrator dashboard">
              <Screen
                capture="admin-dashboard"
                label="Administrator dashboard"
                focus={{ x: 0.6, y: 0.25, zoom: 1.14 }}
              />
            </ProductWindow>
          </div>
        </FadeOut>
      </Sequence>
      <Sequence from={10 * fps} name="Connected institutional roles">
        <RoleNetwork />
      </Sequence>
      <div
        style={{ position: "absolute", bottom: 65, left: 110, fontSize: 32 }}
      >
        Role-based access. Shared institutional workflows.
      </div>
    </SceneTransition>
  );
};
// Frames between roles, so each connection can be read as it arrives.
const STAGGER = 26;
const RoleNetwork = () => {
  const frame = useCurrentFrame();
  const roles = [
    { name: "Students", x: 340, y: 330 },
    { name: "Registrar", x: 1340, y: 330 },
    { name: "Cashier", x: 1340, y: 710 },
    { name: "Alumni", x: 340, y: 710 },
    { name: "Administrator", x: 840, y: 800 },
  ];
  return (
    <div
      style={{
        opacity: interpolate(frame, [0, 25], [0, 1], {
          extrapolateRight: "clamp",
        }),
      }}
    >
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        {roles.map((role, i) => (
          <line
            key={role.name}
            x1={960}
            y1={550}
            x2={role.x + 120}
            y2={role.y + 30}
            stroke="#0F4CDB"
            strokeWidth="2"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={interpolate(frame - i * STAGGER, [0, 36], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
        ))}
        {roles.map((role, i) => {
          const t = interpolate(frame - 190 - i * 18, [0, 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <circle
              key={`pulse-${role.name}`}
              cx={role.x + 120 + (960 - role.x - 120) * t}
              cy={role.y + 30 + (550 - role.y - 30) * t}
              r="9"
              fill={theme.gold}
              opacity={t > 0 && t < 1 ? 1 : 0}
            />
          );
        })}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 800,
          top: 490,
          width: 320,
          padding: "35px 0",
          textAlign: "center",
          backgroundColor: "#0F4CDB",
          borderRadius: 18,
          color: "white",
          fontSize: 49,
          fontWeight: 600,
        }}
      >
        DTC EMS
      </div>
      {roles.map((role, i) => (
        <div
          key={role.name}
          style={{
            position: "absolute",
            left: role.x,
            top: role.y,
            width: 240,
            textAlign: "center",
            padding: "22px 0",
            backgroundColor: "#fff",
            borderRadius: 14,
            boxShadow: "0 2px 6px #0b122014, 0 14px 34px #0b12201f",
            fontSize: 32,
            opacity: interpolate(frame - 26 - i * STAGGER, [0, 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          {role.name}
        </div>
      ))}
    </div>
  );
};
