import { readFile, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";

const manifestPath = "public/assets/capture-manifest.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const expected = [
  "landing",
  "login",
  "application",
  "application-status",
  "student-dashboard",
  "enrollment-create",
  "enrollment-status",
  "registrar-dashboard",
  "applications",
  "enrollment-review",
  "enrollment-approval",
  "student-payment",
  "gcash-submit",
  "cashier-dashboard",
  "cashier-payments",
  "payment-confirmation",
  "alumni-dashboard",
  "document-form",
  "document-status",
  "registrar-documents",
  "admin-dashboard",
];
const approve =
  process.argv
    .find((a) => a.startsWith("--approve="))
    ?.slice(10)
    .split(",") ?? [];
for (const id of approve) {
  assert(manifest[id], `Unknown capture: ${id}`);
  manifest[id].reviewed = true;
}
if (approve.length)
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
const missing = [];
for (const id of expected) {
  const capture = manifest[id];
  if (!capture?.reviewed) {
    missing.push(id);
    continue;
  }
  assert(
    /^assets\/screenshots\/[a-z0-9-]+\.png$/.test(capture.file),
    `Unsafe asset path: ${id}`,
  );
  assert(
    (await stat(`public/${capture.file}`)).size > 1000,
    `Empty capture: ${id}`,
  );
  const png = await readFile(`public/${capture.file}`);
  assert.equal(png.toString("hex", 0, 8), "89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16), 1920, `${id}: incorrect width`);
  assert.equal(png.readUInt32BE(20), 1080, `${id}: incorrect height`);
}
assert(
  existsSync("public/assets/branding/DTC-LOGO.png"),
  "Official branding is missing",
);
console.log(
  `${expected.length - missing.length}/${expected.length} required captures reviewed and validated.`,
);
if (missing.length) console.log(`Pending: ${missing.join(", ")}`);
if (process.argv.includes("--strict") && missing.length) process.exitCode = 1;
