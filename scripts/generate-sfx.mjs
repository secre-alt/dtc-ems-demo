import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Original synthesized effects: no third-party recordings or samples.
// Cue times come from the same JSON files that drive the picture.
const read = (name) =>
  JSON.parse(readFileSync(`src/config/${name}.json`, "utf8"));
const { fps, seconds: duration, scenes } = read("timeline");
const shotData = read("shots");

const rate = 24000;
const length = rate * duration;
const left = new Float32Array(length);
const right = new Float32Array(length);
const cues = [];
let seed = 42;
const noise = () =>
  ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const sine = (hz, t) => Math.sin(2 * Math.PI * hz * t);
const decay = (t, speed, attack = 0.006) =>
  Math.min(1, t / attack) * Math.exp(-speed * t);

// Air movement: noise through a resonant band-pass whose pitch glides.
const air = (size, low, high) => {
  let lp = 0;
  let band = 0;
  return (t) => {
    const arc = Math.sin((Math.PI * t) / size);
    const f = 2 * Math.sin((Math.PI * (low + (high - low) * arc)) / rate);
    lp += f * band;
    const hp = noise() - lp - 0.9 * band;
    band += f * hp;
    return band * arc ** 2;
  };
};
const note = (t, hz, speed) =>
  t < 0
    ? 0
    : decay(t, speed) * (sine(hz, t) + 0.25 * sine(hz * 2.001, t) * decay(t, 4));

const sounds = {
  // Scene change
  swoosh: { size: 0.7, gain: 0.3, make: () => air(0.7, 260, 2300) },
  // Screen change inside a scene
  slide: { size: 0.34, gain: 0.13, make: () => air(0.34, 700, 2600) },
  // The step indicator advances
  tick: { size: 0.16, gain: 0.07, make: () => (t) => note(t, 1318.5, 38) },
  // The spotlight settles
  focus: {
    size: 0.7,
    gain: 0.09,
    make: () => (t) => note(t, 587.33, 7) + note(t - 0.11, 880, 7),
  },
  // A saved verified or approved record appears
  success: {
    size: 1.1,
    gain: 0.13,
    make: () => (t) => note(t, 659.25, 6) + note(t - 0.13, 987.77, 4.5),
  },
  // A role joins the diagram; pitch rises with each one
  pop: { size: 0.3, gain: 0.1, make: (hz) => (t) => note(t, hz, 18) },
  // Soft mark under each closing statement
  accent: { size: 1.2, gain: 0.1, make: (hz) => (t) => note(t, hz, 3.8) },
  // Logo reveals: an A major chord, notes slightly rolled
  chime: {
    size: 2.4,
    gain: 0.1,
    make: () => (t) =>
      [440, 554.37, 659.25, 880].reduce(
        (sum, hz, i) => sum + note(t - i * 0.055, hz, 2.3),
        0,
      ),
  },
  // The cursor confirms a selection.
  click: { size: 0.07, gain: 0.12, make: () => (t) => noise() * decay(t, 90) },
  // Keyboard input under recorded typing.
  key: { size: 0.045, gain: 0.035, make: () => (t) => noise() * decay(t, 110) },
  // Chapter cards in the recorded full-flow demo.
  chapter: {
    size: 0.6,
    gain: 0.08,
    make: () => (t) => note(t, 523.25, 7) + note(t - 0.09, 783.99, 6),
  },
};

function cue(time, type, { pan = 0, hz } = {}) {
  const { size, gain, make } = sounds[type];
  assert(time >= 0 && time + size <= duration, `${type} out of range: ${time}`);
  cues.push({ time: Math.round(time * 1000) / 1000, type });
  const sample = make(hz);
  const first = Math.round(time * rate);
  for (let i = 0; i < size * rate; i++) {
    // Fade the last 30 ms so no cue ends with a click.
    const fade = Math.min(1, (size - i / rate) / 0.03);
    const value = sample(i / rate) * gain * fade;
    left[first + i] += value * Math.sqrt((1 - pan) / 2);
    right[first + i] += value * Math.sqrt((1 + pan) / 2);
  }
}

// Opening: logo, then the landing window.
cue(0.1, "chime");
cue(2, "swoosh", { pan: 0.25 });
for (const scene of Object.values(scenes).slice(1))
  cue(scene.start + 0.03, "swoosh", { pan: scene.start % 2 ? -0.2 : 0.2 });

// Export a compact cue bed for recordings, which use their own timelines.
const recordingDuration = 300;
const recordingLength = rate * recordingDuration;
const recordingLeft = new Float32Array(recordingLength);
const recordingRight = new Float32Array(recordingLength);
for (let time = 0; time < recordingDuration; time += 4)
  for (const type of ["click", "key", "chapter", "success"]) {
    const { size, gain, make } = sounds[type];
    const sample = make();
    const start = time * rate;
    for (let i = 0; i < size * rate; i++) {
      const value = sample(i / rate) * gain;
      recordingLeft[start + i] += value * Math.SQRT1_2;
      recordingRight[start + i] += value * Math.SQRT1_2;
    }
  }
let recordingPeak = 0;
for (let i = 0; i < recordingLength; i++)
  recordingPeak = Math.max(
    recordingPeak,
    Math.abs(recordingLeft[i]),
    Math.abs(recordingRight[i]),
  );
assert(recordingPeak > 0.01, "Silent recording cue bed");
const recordingPcm = Buffer.alloc(44 + recordingLength * 4);
recordingPcm.write("RIFF", 0);
recordingPcm.writeUInt32LE(recordingPcm.length - 8, 4);
recordingPcm.write("WAVEfmt ", 8);
recordingPcm.writeUInt32LE(16, 16);
recordingPcm.writeUInt16LE(1, 20);
recordingPcm.writeUInt16LE(2, 22);
recordingPcm.writeUInt32LE(rate, 24);
recordingPcm.writeUInt32LE(rate * 4, 28);
recordingPcm.writeUInt16LE(4, 32);
recordingPcm.writeUInt16LE(16, 34);
recordingPcm.write("data", 36);
recordingPcm.writeUInt32LE(recordingLength * 4, 40);
for (let i = 0; i < recordingLength; i++) {
  recordingPcm.writeInt16LE(
    Math.max(-32768, Math.min(32767, Math.round((recordingLeft[i] / recordingPeak) * 16384))),
    44 + i * 4,
  );
  recordingPcm.writeInt16LE(
    Math.max(-32768, Math.min(32767, Math.round((recordingRight[i] / recordingPeak) * 16384))),
    46 + i * 4,
  );
}
mkdirSync("public/assets/audio", { recursive: true });
writeFileSync("public/assets/audio/recording-effects.wav", recordingPcm);

for (const [name, data] of Object.entries(shotData)) {
  const scene = scenes[name];
  const frames = Math.round(scene.seconds * fps);
  data.shots.forEach((shot, i) => {
    // Same rounding as FeatureScene.tsx.
    const at = scene.start + Math.round((i * frames) / data.shots.length) / fps;
    cue(at + 0.03, i === 0 ? "swoosh" : "slide", { pan: i % 2 ? -0.2 : 0.2 });
    if (i > 0 && shot.step !== data.shots[i - 1].step)
      cue(at + 0.32, "tick", { pan: 0.3 });
    // Spotlight starts at frame 90 of its shot.
    if (shot.spotlight) cue(at + 90 / fps, "focus");
    if (shot.sound) cue(at + 0.6, shot.sound);
  });
}

// Administration: dashboard, then roles at the frames used by RoleNetwork.
const admin = scenes.administration.start;
cue(admin + 0.03, "swoosh");
cue(admin + 10, "slide");
[523.25, 587.33, 659.25, 783.99, 880].forEach((hz, i) =>
  cue(admin + 10 + (26 + i * 26) / fps, "pop", {
    pan: [-0.4, 0.4, 0.4, -0.4, 0][i],
    hz,
  }),
);

// Closing: three statements, then the sign-off.
const closing = scenes.closing.start;
[440, 554.37, 659.25].forEach((hz, i) =>
  cue(closing + i * 2 + 0.15, "accent", { hz }),
);
cue(closing + 11, "chime");

// A light room reflection, so tones do not sound dry.
for (const channel of [left, right]) {
  const dry = channel.slice();
  const spread = channel === left ? 1 : 1.13;
  for (const [ms, gain] of [
    [47, 0.16],
    [83, 0.11],
    [131, 0.07],
  ]) {
    const offset = Math.round((ms * spread * rate) / 1000);
    for (let i = offset; i < length; i++)
      channel[i] += dry[i - offset] * gain;
  }
}

let peak = 0;
for (let i = 0; i < length; i++)
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
assert(Number.isFinite(peak) && peak > 0.01, "Silent or invalid audio");
// Normalize the stem to -6 dBFS to leave headroom for voice and music.
const level = 0.5 / peak;

const pcm = Buffer.alloc(44 + length * 4);
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
pcm.writeUInt32LE(length * 4, 40);
for (let i = 0; i < length; i++) {
  pcm.writeInt16LE(Math.round(left[i] * level * 32767), 44 + i * 4);
  pcm.writeInt16LE(Math.round(right[i] * level * 32767), 46 + i * 4);
}
cues.sort((a, b) => a.time - b.time);
mkdirSync("public/assets/audio", { recursive: true });
writeFileSync("public/assets/audio/sound-design.wav", pcm);
writeFileSync(
  "public/assets/audio/cues.json",
  JSON.stringify(
    {
      provenance: "Original procedural synthesis; no third-party samples",
      duration,
      peak: 0.5,
      cues,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Generated ${cues.length} stereo cues; peak 0.5; ${duration}s`);
