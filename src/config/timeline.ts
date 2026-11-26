import data from "./timeline.json";

export const timeline = data.scenes;
export const video = {
  fps: data.fps,
  width: data.width,
  height: data.height,
  seconds: data.seconds,
};
export const timing = (key: keyof typeof timeline) => ({
  from: Math.round(timeline[key].start * video.fps),
  durationInFrames: Math.round(timeline[key].seconds * video.fps),
});
