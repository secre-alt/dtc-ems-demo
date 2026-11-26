// The manifest is private (ignored by Git), but the app imports it.
// Create an empty one on a fresh clone; never overwrite an existing file.
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("public/assets", { recursive: true });
try {
  writeFileSync("public/assets/capture-manifest.json", "{}\n", { flag: "wx" });
  console.log("Created an empty capture manifest (placeholders will show).");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
}
