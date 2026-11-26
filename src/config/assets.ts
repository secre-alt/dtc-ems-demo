import manifest from "../../public/assets/capture-manifest.json";
export type Capture = {
  file: string;
  path: string;
  capturedAt: string;
  role: string;
  reviewed?: boolean;
};
export const captures = manifest as Record<string, Capture>;
export const audio = {
  music: { src: "", volume: 0.12 },
  narration: { src: "", volume: 1 },
  effects: { src: "assets/audio/sound-design.wav", volume: 0.65 },
};
