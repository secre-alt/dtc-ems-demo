import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = async (name) =>
  JSON.parse(await readFile(`src/config/${name}.json`, "utf8"));
const { fps, seconds, scenes } = await read("timeline");
let end = 0;
for (const [name, scene] of Object.entries(scenes)) {
  assert.equal(scene.start, end, `Gap or overlap before ${name}`);
  assert(scene.seconds > 0);
  end += scene.seconds;
}
assert.equal(end, seconds, "Scenes do not add up to the total duration");
for (const [name, scene] of Object.entries(await read("shots"))) {
  assert(scenes[name], `Shots for unknown scene: ${name}`);
  let step = 0;
  for (const { label, step: next, focus, spotlight } of scene.shots) {
    assert(next >= step && next < scene.steps.length, `${label}: bad step`);
    step = next;
    assert(focus.x >= 0 && focus.x <= 1, `${label}: focus.x`);
    assert(focus.y >= 0 && focus.y <= 1, `${label}: focus.y`);
    assert(focus.zoom >= 1 && focus.zoom <= 2, `${label}: focus.zoom`);
    if (spotlight) {
      assert(spotlight.x + spotlight.width <= 1, `${label}: spotlight`);
      assert(spotlight.y + spotlight.height <= 1, `${label}: spotlight`);
    }
  }
}
console.log(`Timeline and shot data OK: ${seconds}s, ${seconds * fps} frames.`);
