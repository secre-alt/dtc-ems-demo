// Short original click and key sounds for recorded interactions.
import { mkdirSync, writeFileSync } from "node:fs";

const rate = 24000;
let seed = 7;
const noise = () =>
  ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296) * 2 - 1;
function write(name, seconds, sample) {
  const length = Math.round(rate * seconds);
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
  for (let i = 0; i < length; i++) {
    const value = Math.max(-1, Math.min(1, sample(i / rate)));
    wav.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  writeFileSync(`public/assets/audio/${name}.wav`, wav);
}
mkdirSync("public/assets/audio", { recursive: true });
write(
  "click",
  0.07,
  (t) =>
    (noise() * 0.35 * Math.exp(-260 * t) +
      Math.sin(2 * Math.PI * 1900 * t) * 0.3 * Math.exp(-90 * t)) *
    Math.min(1, t / 0.001),
);
write(
  "key",
  0.045,
  (t) => noise() * 0.22 * Math.exp(-150 * t) * Math.min(1, t / 0.001),
);
write(
  "chapter",
  0.6,
  (t) =>
    (Math.sin(2 * Math.PI * 523.25 * t) * 0.18 * Math.exp(-7 * t) +
      (t > 0.09
        ? Math.sin(2 * Math.PI * 783.99 * (t - 0.09)) *
          0.16 *
          Math.exp(-6 * (t - 0.09))
        : 0)) *
    Math.min(1, t / 0.008) *
    Math.min(1, (0.6 - t) / 0.05),
);
console.log("Wrote click.wav, key.wav and chapter.wav");
