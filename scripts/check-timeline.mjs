import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const text = await readFile("src/config/timeline.ts", "utf8");
const scenes = [...text.matchAll(/start: (\d+), seconds: (\d+)/g)].map((m) => ({
  start: +m[1],
  duration: +m[2],
}));
assert.equal(scenes.length, 8);
let end = 0;
for (const scene of scenes) {
  assert.equal(scene.start, end, "Gap or overlap in timeline");
  assert(scene.duration > 0);
  end += scene.duration;
}
assert.equal(end, 210);
console.log(
  "8 scenes; continuous 210-second base timeline; 6,300 frames at 30 fps.",
);
