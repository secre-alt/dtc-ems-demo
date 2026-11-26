import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline/promises";

const root = process.cwd();
const config = existsSync("capture.local.json")
  ? JSON.parse(await readFile("capture.local.json", "utf8"))
  : {};
const base = new URL(config.baseUrl ?? "http://127.0.0.1:8000");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname))
  throw new Error("Capture is restricted to the local application.");
const manual = process.argv.includes("--manual");
const publicOnly = process.argv.includes("--public");
const manifestPath = "public/assets/capture-manifest.json";
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const allShots = [
  ["landing", "public", "/", "body"],
  ["login", "public", "/login", "form"],
  ["application", "public", "/apply", "main"],
  ["application-status", "public", "/apply/status", "main"],
  ["student-dashboard", "student", "/portal/dashboard", ".content"],
  ["enrollment-create", "student", "/portal/enrollment/create", ".content"],
  ["enrollment-status", "student", "/portal/enrollment", ".content"],
  ["alumni-dashboard", "alumni", "/portal/dashboard", ".content"],
  ["document-form", "alumni", "/portal/documents/create", ".dr-create"],
  ["document-status", "alumni", "/portal/documents", ".content"],
  ["registrar-dashboard", "registrar", "/registrar/dashboard", ".content"],
  ["applications", "registrar", "/registrar/applications", ".content"],
  ["enrollment-review", "registrar", "/registrar/enrollments", ".content"],
  ["registrar-documents", "registrar", "/registrar/documents", ".content"],
  ["cashier-dashboard", "cashier", "/cashier/dashboard", ".content"],
  ["cashier-payments", "cashier", "/cashier/payments", ".content"],
  ["admin-dashboard", "admin", "/admin/dashboard", ".content"],
  ...(config.extraShots ?? []).map((s) => [
    s.id,
    s.role,
    s.path,
    s.readySelector ?? ".content",
  ]),
];
const only = process.argv
  .find((arg) => arg.startsWith("--only="))
  ?.slice(7)
  .split(",");
const shots = [
  ...new Map(allShots.map((shot) => [shot[0], shot])).values(),
].filter(([id]) => !only || only.includes(id));
if (
  !shots.length ||
  (only && only.some((id) => !allShots.some((shot) => shot[0] === id)))
)
  throw new Error("Unknown capture selection");
const roles = [...new Set(shots.map((s) => s[1]))];
const browser = await chromium.launch({ channel: "msedge", headless: !manual });
await mkdir("public/assets/screenshots", { recursive: true });
const prompt = manual
  ? createInterface({ input: process.stdin, output: process.stdout })
  : null;
let failures = 0;
try {
  for (const role of roles) {
    const account = config.accounts?.[role];
    if (
      role !== "public" &&
      (publicOnly ||
        config.syntheticDataOnly !== true ||
        (!manual && (!account?.email || !account?.password)))
    ) {
      console.log(`[skip] ${role}: synthetic demo access not configured`);
      continue;
    }
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2,
      locale: "en-US",
      timezoneId: "Asia/Manila",
      reducedMotion: "reduce",
    });
    let allowLogin = false;
    // Only normal login may POST. Capture never submits an application or changes records.
    await context.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (
        ["GET", "HEAD"].includes(request.method()) ||
        (allowLogin &&
          request.method() === "POST" &&
          url.origin === base.origin &&
          url.pathname === "/login")
      )
        await route.continue();
      else await route.abort();
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    try {
      if (role !== "public") {
        await page.goto(new URL("/login", base).href, {
          waitUntil: "domcontentloaded",
        });
        allowLogin = true;
        if (manual)
          await prompt.question(
            `Log into the ${role} synthetic account in Edge, then press Enter here. `,
          );
        else {
          await page.locator('input[name="email"]').fill(account.email);
          await page.locator('input[name="password"]').fill(account.password);
          await Promise.all([
            page.waitForURL((url) => url.pathname !== "/login"),
            page.locator('button[type="submit"]').first().click(),
          ]);
        }
        allowLogin = false;
        if (
          ["/login", "/account/password", "/email/verify"].includes(
            new URL(page.url()).pathname,
          )
        )
          throw new Error("Login requires manual action");
      }
      for (const [id, , routePath, selector] of shots.filter(
        (s) => s[1] === role,
      )) {
        if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error("Invalid shot ID");
        const url = new URL(routePath, base);
        if (url.origin !== base.origin || !routePath.startsWith("/"))
          throw new Error("Invalid capture path");
        try {
          const response = await page.goto(url.href, {
            waitUntil: "networkidle",
            timeout: 40000,
          });
          if (!response?.ok()) throw new Error("Page unavailable");
          if (
            new URL(page.url()).pathname.replace(/\/$/, "") !==
            url.pathname.replace(/\/$/, "")
          )
            throw new Error("Unexpected redirect");
          await page.locator(selector).first().waitFor({ state: "visible" });
          if (
            id === "gcash-submit" &&
            url.pathname === "/portal/documents/create"
          ) {
            // These are client-side wizard steps; the request is never submitted.
            await page.locator('label[for="document-0"]').click();
            await page.locator("[data-request-next]").click();
            await page
              .locator('[name="purpose"]')
              .fill("Fictional demonstration request");
            await page.locator("[data-request-next]").click();
            await page.locator('input[value="gcash_qr"]').first().check();
            await page.locator("[data-document-gcash]:visible").waitFor();
            await page.locator("#reference-0").fill("DEMO-REFERENCE-ONLY");
            await page
              .locator("#reference-0")
              .evaluate((element) =>
                element.scrollIntoView({ block: "center" }),
              );
          }
          await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all(
              [...document.images].map((img) =>
                img.complete
                  ? Promise.resolve()
                  : new Promise((resolve) => {
                      img.onload = resolve;
                      img.onerror = resolve;
                    }),
              ),
            );
          });
          await page.addStyleTag({
            content:
              '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important} .dtc-gcash-account,.dr-gcash-transfer,.dr-gcash-qr,img[alt*="QR"],img[src*="gcash-qr"],img[src*="gcash/qr"]{visibility:hidden!important}',
          });
          const file = `assets/screenshots/${id}.png`;
          await page.screenshot({
            path: path.join(root, "public", file),
            fullPage: false,
            animations: "disabled",
          });
          manifest[id] = {
            file,
            path: routePath,
            capturedAt: new Date().toISOString(),
            role,
            reviewed: false,
          };
          await writeFile(
            manifestPath,
            JSON.stringify(manifest, null, 2) + "\n",
          );
          console.log(`[captured; review required] ${id}`);
        } catch {
          failures++;
          console.log(
            `[failed] ${id}: page, selector, or authorization unavailable; no screenshot accepted`,
          );
        }
      }
    } catch {
      failures++;
      console.log(
        `[failed] ${role}: authentication unavailable; credentials are never logged`,
      );
    } finally {
      await context.close();
    }
  }
} finally {
  prompt?.close();
  await browser.close();
}
console.log(
  `Capture finished. ${failures} failures. Review images before enabling them in the composition.`,
);
if (failures) process.exitCode = 1;
