// Records a REAL interaction with the local app: cursor, clicks, typing.
// Pilot flow: the alumni document request wizard. It is never submitted, and
// every write request except the normal login is blocked.
import { chromium } from "playwright";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

const config = JSON.parse(await readFile("capture.local.json", "utf8"));
const base = new URL(config.baseUrl ?? "http://127.0.0.1:8000");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname))
  throw new Error("Recording is restricted to the local application.");
const account = config.accounts?.alumni;
if (config.syntheticDataOnly !== true || !account?.email || !account?.password)
  throw new Error("Set up a synthetic alumni account in capture.local.json.");

const size = { width: 1920, height: 1080 };
const out = "public/assets/recordings";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL ?? "msedge",
});

// Only the normal login may POST.
let allowLogin = false;
const guard = (context) =>
  context.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const isLogin =
      allowLogin &&
      request.method() === "POST" &&
      url.origin === base.origin &&
      url.pathname === "/login";
    return ["GET", "HEAD"].includes(request.method()) || isLogin
      ? route.continue()
      : route.abort();
  });

// Runs in the page: draws a cursor (recordings have none) and hides payment
// account details and QR codes before they can appear in any frame.
const overlay = () => {
  const install = () => {
    const style = document.createElement("style");
    style.textContent =
      '.dtc-gcash-account,.dr-gcash-transfer,.dr-gcash-qr,img[alt*="QR"],img[src*="gcash-qr"],img[src*="gcash/qr"]{visibility:hidden!important}';
    const cursor = document.createElement("div");
    cursor.innerHTML =
      '<svg width="30" height="36" viewBox="0 0 30 36"><path d="M2 2V29L9 22L15 34L21 31L15 20H27Z" fill="#141820" stroke="#fff" stroke-width="2"/></svg>';
    cursor.style.cssText =
      "position:fixed;left:-60px;top:-60px;z-index:2147483647;pointer-events:none";
    document.documentElement.append(style, cursor);
    addEventListener(
      "mousemove",
      (e) => {
        cursor.style.left = `${e.clientX - 2}px`;
        cursor.style.top = `${e.clientY - 2}px`;
      },
      true,
    );
    addEventListener(
      "mousedown",
      (e) => {
        const ring = document.createElement("div");
        ring.style.cssText = `position:fixed;left:${e.clientX - 22}px;top:${e.clientY - 22}px;width:38px;height:38px;border:3px solid #0F4CDB;border-radius:50%;z-index:2147483646;pointer-events:none`;
        document.documentElement.append(ring);
        ring.animate(
          [
            { transform: "scale(.3)", opacity: 1 },
            { transform: "scale(1.4)", opacity: 0 },
          ],
          { duration: 450, easing: "ease-out" },
        ).onfinish = () => ring.remove();
      },
      true,
    );
  };
  if (document.documentElement) install();
  else addEventListener("DOMContentLoaded", install);
};

try {
  // Log in off camera. The session stays in memory only.
  const login = await browser.newContext({ viewport: size });
  await guard(login);
  const loginPage = await login.newPage();
  await loginPage.goto(new URL("/login", base).href);
  await loginPage.locator('input[name="email"]').fill(account.email);
  await loginPage.locator('input[name="password"]').fill(account.password);
  allowLogin = true;
  await Promise.all([
    loginPage.waitForURL((url) => url.pathname !== "/login"),
    loginPage.locator('button[type="submit"]').first().click(),
  ]);
  allowLogin = false;
  const storageState = await login.storageState();
  await login.close();

  const context = await browser.newContext({
    viewport: size,
    storageState,
    locale: "en-US",
    timezoneId: "Asia/Manila",
    recordVideo: { dir: out, size },
  });
  await guard(context);
  await context.addInitScript(overlay);
  const started = Date.now();
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const events = [];
  const now = () => (Date.now() - started) / 1000;
  const wait = (ms) => page.waitForTimeout(ms);
  let mouse = { x: 1300, y: 760 };

  // Eased mouse travel in small steps, like a hand.
  const moveTo = async (x, y) => {
    const from = mouse;
    const steps = 36;
    for (let i = 1; i <= steps; i++) {
      const p = i / steps;
      const e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
      await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
      await wait(16);
    }
    mouse = { x, y };
  };
  const click = async (selector) => {
    const target = page.locator(selector).first();
    await target.waitFor({ state: "visible" });
    // Scroll smoothly so the viewer can follow.
    await target.evaluate((el) =>
      el.scrollIntoView({ block: "center", behavior: "smooth" }),
    );
    await wait(700);
    const box = await target.boundingBox();
    const x = box.x + Math.min(box.width * 0.5, 180);
    const y = box.y + box.height / 2;
    await moveTo(x, y);
    await wait(250);
    events.push({ type: "click", time: now(), x, y });
    await page.mouse.down();
    await wait(90);
    await page.mouse.up();
    await wait(900);
  };
  const type = async (text) => {
    for (const char of text) {
      events.push({ type: "key", time: now() });
      await page.keyboard.type(char);
      await wait(65);
    }
    await wait(700);
  };

  await page.goto(new URL("/portal/documents/create", base).href, {
    waitUntil: "networkidle",
  });
  await page.locator(".dr-create").waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.mouse.move(mouse.x, mouse.y);
  const trim = now();
  await wait(1500);
  await click('label[for="document-0"]');
  await click("[data-request-next]");
  await click('[name="purpose"]');
  await type("Fictional demonstration request");
  await click("[data-request-next]");
  await click('input[value="gcash_qr"]');
  await page.locator("[data-document-gcash]:visible").waitFor();
  await click("#reference-0");
  await type("DEMO-REFERENCE-ONLY");
  await wait(2500);
  const end = now();

  const video = page.video();
  await context.close();
  await rename(await video.path(), `${out}/document-request.webm`);
  await writeFile(
    `${out}/document-request.json`,
    JSON.stringify({ ...size, trim, end, events }, null, 2) + "\n",
  );
  console.log(
    `Recorded ${(end - trim).toFixed(1)}s with ${events.length} events. Watch the file for private data before using it.`,
  );
} finally {
  await browser.close();
}
