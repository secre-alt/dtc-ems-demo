import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Original synthesized effects: no third-party recordings or samples.
const timelineSource = readFileSync("src/config/timeline.ts", "utf8");
const scenes = [
  ...timelineSource.matchAll(/(\w+): \{ start: (\d+), seconds: (\d+) \}/g),
].map(([, name, start, seconds]) => ({
  name,
  start: Number(start),
  seconds: Number(seconds),
}));
const duration = Number(
  timelineSource.match(/height: 1080, seconds: (\d+)/)?.[1],
);
assert.equal(scenes.length, 8);
assert.equal(
  duration,
  210,
  "Regenerate cue timing when changing film duration",
);
const rate = 24000;
const samples = new Float32Array(rate * duration * 2);
const cues = [];
let seed = 42;
const noise = () =>
  ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296) * 2 - 1;
function cue(time, type, pan = 0) {
  const length = type === "chime" ? 1.5 : 0.65;
  assert(time >= 0 && time + length <= duration);
  cues.push({ time, type });
  let filtered = 0;
  for (let i = 0; i < length * rate; i++) {
    const t = i / rate;
    const attack = Math.min(1, t / 0.018);
    filtered = 0.82 * filtered + 0.18 * noise();
    const value =
      type === "chime"
        ? attack *
          Math.exp(-4.2 * t) *
          (Math.sin(2 * Math.PI * 660 * t) +
            0.4 * Math.sin(2 * Math.PI * 990 * t)) *
          0.19
        : Math.sin((Math.PI * t) / length) ** 2 *
          (filtered * 0.65 +
            Math.sin(2 * Math.PI * (110 * t + 70 * t * t)) * 0.035);
    const index = (Math.round(time * rate) + i) * 2;
    samples[index] += value * Math.sqrt((1 - pan) / 2);
    samples[index + 1] += value * Math.sqrt((1 + pan) / 2);
  }
}
const shotCounts = {
  overview: 3,
  student: 4,
  registrar: 4,
  payments: 4,
  documents: 5,
};
for (const scene of scenes) {
  cue(
    scene.start + 0.08,
    scene.name === "intro" || scene.name === "closing" ? "chime" : "whoosh",
  );
  const count = shotCounts[scene.name];
  for (let i = 1; i < count; i++)
    cue(
      scene.start + Math.round(((i * scene.seconds) / count) * 30) / 30,
      "whoosh",
      i % 2 ? -0.25 : 0.25,
    );
}
cue(4, "whoosh", 0.25);
cue(170, "chime");
cue(187, "chime");
cue(189, "chime");
cue(196, "chime");
let peak = 0;
for (const sample of samples) {
  assert(Number.isFinite(sample));
  peak = Math.max(peak, Math.abs(sample));
}
assert(peak > 0.05 && peak < 0.8, `Invalid audio peak ${peak}`);
const pcm = Buffer.alloc(44 + samples.length * 2);
pcm.write("RIFF", 0);
pcm.writeUInt32LE(pcm.length - 8, 4);
pcm.write("WAVEfmt ", 8);
pcm.writeUInt32LE(16, 16);
pcm.writeUInt16LE(1, 20);
pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(rate, 24);
pcm.writeUInt32LE(rate * 4, 28);
pcm.writeUInt16LE(4, 32);
pcm.writeUInt16LE(16, 34);
pcm.write("data", 36);
pcm.writeUInt32LE(samples.length * 2, 40);
samples.forEach((value, i) =>
  pcm.writeInt16LE(Math.round(value * 32767), 44 + i * 2),
);
mkdirSync("public/assets/audio", { recursive: true });
writeFileSync("public/assets/audio/sound-design.wav", pcm);
writeFileSync(
  "public/assets/audio/cues.json",
  JSON.stringify(
    {
      provenance: "Original procedural synthesis; no third-party samples",
      duration,
      peak,
      cues,
    },
    null,
    2,
  ),
);
console.log(
  `Generated ${cues.length} stereo cues; peak ${peak.toFixed(3)}; ${duration}s`,
);
