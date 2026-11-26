export const timeline = {
  intro: { start: 0, seconds: 12 },
  overview: { start: 12, seconds: 18 },
  student: { start: 30, seconds: 35 },
  registrar: { start: 65, seconds: 30 },
  payments: { start: 95, seconds: 30 },
  documents: { start: 125, seconds: 35 },
  administration: { start: 160, seconds: 25 },
  closing: { start: 185, seconds: 25 },
} as const;
export const video = { fps: 30, width: 1920, height: 1080, seconds: 210 };
// Scene boundaries and duration scale together when the central duration changes.
export const timing = (key: keyof typeof timeline) => ({
  from: Math.round((timeline[key].start / 210) * video.seconds * video.fps),
  durationInFrames:
    Math.round(
      ((timeline[key].start + timeline[key].seconds) / 210) *
        video.seconds *
        video.fps,
    ) - Math.round((timeline[key].start / 210) * video.seconds * video.fps),
});
