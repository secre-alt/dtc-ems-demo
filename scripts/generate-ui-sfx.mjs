// Original synthesized sounds for recorded interactions. No samples.
import { mkdirSync, writeFileSync } from "node:fs";

const rate = 24000;
// Raises every sound together, so their balance stays the same.
const LOUDNESS = 1.65;
let seed = 7;
const noise = () =>
  ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const sine = (hz, t) => Math.sin(2 * Math.PI * hz * t);
// A sound that starts at `at`, with a very short attack and a decaying tail.
const hit = (t, at, speed) =>
  t < at ? 0 : Math.min(1, (t - at) / 0.0008) * Math.exp(-speed * (t - at));

// `peak` is the loudest point of the finished file, from 0 to 1.
function write(name, seconds, peak, sample) {
  const length = Math.round(rate * seconds);
  const values = Array.from({ length }, (_, i) => {
    const t = i / rate;
    // Fade the last 8 ms so no sound ends with a pop.
    return sample(t) * Math.min(1, (seconds - t) / 0.008);
  });
  const level = (peak * LOUDNESS) / Math.max(...values.map(Math.abs));
  const wav = Buffer.alloc(44 + length * 2);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(length * 2, 40);
  values.forEach((value, i) =>
    wav.writeInt16LE(Math.round(value * level * 32767), 44 + i * 2),
  );
  writeFileSync(`public/assets/audio/${name}.wav`, wav);
}

// A key press: a crisp tick, a low "thock", then a quieter release.
const keystroke = (name, seconds, { body, tick, release, peak }) => {
  let last = 0;
  write(name, seconds, peak, (t) => {
    const white = noise();
    const crisp = white - last; // Removes the dull low end of the noise.
    last = white;
    return (
      crisp * 0.45 * hit(t, 0, 420) +
      sine(body, t) * 0.55 * hit(t, 0.001, 95) +
      sine(tick, t) * 0.18 * hit(t, 0, 260) +
      crisp * 0.16 * hit(t, release, 520)
    );
  });
};

mkdirSync("public/assets/audio", { recursive: true });

// Four slightly different keys, so typing does not sound like a machine.
[
  { body: 205, tick: 2300, release: 0.052, peak: 0.42 },
  { body: 232, tick: 2750, release: 0.047, peak: 0.37 },
  { body: 188, tick: 2050, release: 0.056, peak: 0.45 },
  { body: 218, tick: 2520, release: 0.05, peak: 0.39 },
].forEach((key, i) => keystroke(`key-${i + 1}`, 0.09, key));
keystroke("key-space", 0.12, {
  body: 128,
  tick: 1500,
  release: 0.07,
  peak: 0.5,
});

// A mouse button going down and coming back up.
write(
  "click",
  0.13,
  0.55,
  (t) =>
    noise() * 0.35 * hit(t, 0, 430) +
    sine(1900, t) * 0.4 * hit(t, 0, 160) +
    noise() * 0.2 * hit(t, 0.08, 500) +
    sine(2500, t) * 0.22 * hit(t, 0.08, 220),
);

// Soft moving air for a new page or the next form step.
let low = 0;
let band = 0;
write("whoosh", 0.45, 0.2, (t) => {
  const arc = Math.sin((Math.PI * t) / 0.45);
  const f = 2 * Math.sin((Math.PI * (300 + 1700 * arc)) / rate);
  low += f * band;
  const high = noise() - low - 0.9 * band;
  band += f * high;
  return band * arc ** 2;
});

// A weighty but quiet landing: a falling low tone with a soft tap on top. It
// keeps some mid range, so laptop speakers still play it.
const thump = (t, at) => {
  if (t < at) return 0;
  const age = t - at;
  // The pitch falls from 190 Hz to 90 Hz.
  const phase = 90 * age + (100 / 28) * (1 - Math.exp(-28 * age));
  return (
    Math.sin(2 * Math.PI * phase) * hit(t, at, 17) +
    noise() * 0.18 * hit(t, at, 240)
  );
};
// A step is finished. No musical notes: they sound like an alert.
write("success", 0.36, 0.38, (t) => thump(t, 0));

// Chapter card: air that builds, then lands as the title appears.
const swish = (seconds, from, to) => {
  let lp = 0;
  let bp = 0;
  return (t) => {
    const p = Math.min(1, t / seconds);
    const f = 2 * Math.sin((Math.PI * (from + (to - from) * p)) / rate);
    lp += f * bp;
    const hp = noise() - lp - 0.9 * bp;
    bp += f * hp;
    return t < seconds ? bp * p ** 2 * Math.min(1, (seconds - t) / 0.04) : 0;
  };
};
const rise = swish(0.4, 350, 1800);
write("chapter", 0.75, 0.4, (t) => rise(t) * 0.5 + thump(t, 0.36));
console.log("Wrote the click, keyboard, whoosh, success and chapter sounds");
