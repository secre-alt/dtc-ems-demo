import { spawn, spawnSync } from "node:child_process";
import { openSync, closeSync, mkdirSync } from "node:fs";
mkdirSync("out", { recursive: true });
const draft = process.argv.includes("--draft");
if (!draft) {
  const validation = spawnSync(
    process.execPath,
    ["scripts/validate-assets.mjs", "--strict"],
    { stdio: "inherit", windowsHide: true },
  );
  if (validation.status !== 0) process.exit(1);
}
const output = draft
  ? "out/dtc-ems-review-draft.mp4"
  : "out/dtc-ems-official-demo.mp4";
const logPath = draft ? "out/render-draft.log" : "out/render-official.log";
const log = openSync(logPath, "w");
const child = spawn(
  process.execPath,
  [
    "node_modules/@remotion/cli/remotion-cli.js",
    "render",
    "DTCEMSDemo",
    output,
    "--codec=h264",
    "--pixel-format=yuv420p",
    "--concurrency=2",
    "--log=error",
  ],
  { stdio: ["ignore", log, log], windowsHide: true },
);
closeSync(log);
child.on("error", () => {
  console.error(`Renderer launch failed; check ${logPath}`);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  console.log(`Renderer exited ${code}; output: ${output}; log: ${logPath}`);
  process.exitCode = code ?? 1;
});
