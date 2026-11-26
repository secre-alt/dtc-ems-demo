import {
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  AnimatedText,
  BrowserFrame,
  SceneTransition,
} from "../components/Motion";
export const Administration = () => {
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <SceneTransition duration={durationInFrames}>
      <div style={{ position: "absolute", left: 110, top: 95 }}>
        <AnimatedText size={88}>Everything works together.</AnimatedText>
      </div>
      <Sequence durationInFrames={10 * fps} name="Administrator dashboard">
        <div
          style={{
            position: "absolute",
            left: 384,
            top: 220,
            scale: ".80",
            transformOrigin: "top left",
          }}
        >
          <BrowserFrame
            capture="admin-dashboard"
            label="Administrator dashboard"
            zoom={1.06}
          />
        </div>
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
            strokeDashoffset={interpolate(frame - i * 8, [0, 45], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
        ))}
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
            backgroundColor: "#F5F7FA",
            fontSize: 32,
            opacity: interpolate(frame - i * 8, [0, 24], [0, 1], {
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
