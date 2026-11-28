// Records the REAL end-to-end flow against a separate demo copy of the app:
// application, Registrar approval, account setup, enrollment, section
// assignment, Cashier payment, final approval and the COR.
//
// This one WRITES records, so it only runs against the demo database prepared
// by scripts/demo-db-setup.php.
import { chromium } from "playwright";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createActor, overlay, size } from "./lib/stage.mjs";
import { findFlashEnd, flash } from "./lib/sync.mjs";

const config = JSON.parse(
  await readFile("demo.local.json", "utf8").catch(() => {
    throw new Error(
      "demo.local.json is missing. Run scripts/demo-db-setup.php first.",
    );
  }),
);
const base = new URL(config.baseUrl);
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname))
  throw new Error("Recording is restricted to the local application.");
if (base.port === "8000")
  throw new Error("Port 8000 is your normal app. Serve the demo copy on 8001.");
for (const role of ["registrar", "cashier"]) {
  const account = config[role];
  if (
    config.syntheticDataOnly !== true ||
    !account?.email?.endsWith("@example.test") ||
    !account.password
  )
    throw new Error(
      "demo.local.json must contain the generated @example.test demo accounts.",
    );
}

const stamp = Date.now().toString(36);
const applicant = {
  first: "Maria",
  middle: "Demo",
  last: "Santos",
  email: `demo.applicant.${stamp}@example.test`,
  password: config.applicantPassword,
};

const out = "public/assets/recordings/flow";
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const logStart = await stat(config.mailLog).then(
  (s) => s.size,
  () => 0,
);

// Reads the activation link from the demo app's mail log (mail is not sent).
const activationLink = async () => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const buffer = await readFile(config.mailLog).catch(() => Buffer.alloc(0));
    const text = buffer
      .subarray(buffer.length >= logStart ? logStart : 0)
      .toString("utf8")
      .replace(/=\r?\n/g, "")
      .replace(/=3D/g, "=")
      .replace(/&amp;/g, "&");
    const links =
      text.match(
        /https?:\/\/[^\s"'<>()[\]]+\/set-password\/[^\s"'<>()[\]]+/g,
      ) ?? [];
    for (const link of links.reverse()) {
      const url = new URL(link);
      if (url.searchParams.get("email") === applicant.email)
        return new URL(url.pathname + url.search, base).href;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    "No activation link in the mail log. Check MAIL_MAILER=log in .env.demo.",
  );
};

// Every write is blocked unless this flow needs it.
const flowWrites = [
  /^\/apply$/,
  /^\/set-password$/,
  /^\/registrar\/applications\/\d+\/(start-review|approve)$/,
  /^\/registrar\/enrollments\/\d+\/approve$/,
  /^\/portal\/enrollment$/,
  /^\/cashier\/payments\/\d+$/,
  /^\/notifications\/student-welcome$/,
];
let writesEnabled = false;

const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL ?? "msedge",
});

const newContext = async () => {
  const context = await browser.newContext({
    viewport: size,
    locale: "en-US",
    timezoneId: "Asia/Manila",
    recordVideo: { dir: `${out}/raw`, size },
  });
  await context.route("**/*", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (["GET", "HEAD"].includes(request.method())) return route.continue();
    const allowed =
      url.origin === base.origin &&
      (url.pathname === "/login" ||
        (writesEnabled && flowWrites.some((path) => path.test(url.pathname))));
    return allowed ? route.continue() : route.abort();
  });
  await context.addInitScript(overlay);
  return context;
};

const href = (path) => new URL(path, base).href;
const pathOf = (page) => new URL(page.url()).pathname;
const expectPath = (page, pattern) => {
  if (!pattern.test(pathOf(page)))
    throw new Error(
      `Expected a page matching ${pattern}, got ${pathOf(page).replace(/(set-password\/).+/, "$1…")}`,
    );
};

// Signs in on the current page, which shows the sign-in dialog.
const fillLogin = async (actor, account) => {
  await actor.type("#modal_email", account.email);
  await actor.type('#dtcSignInForm [name="password"]', account.password);
  await actor.submit('#dtcSignInForm button[type="submit"]');
};

// Off camera: sign a staff member in. These accounts exist ONLY in the demo
// database, so a failed sign-in means this is not the demo app.
const signInStaff = async (role, landing) => {
  const context = await newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  await page.goto(href("/login"));
  await page.locator("#modal_email").fill(config[role].email);
  await page
    .locator('#dtcSignInForm [name="password"]')
    .fill(config[role].password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "load" }),
    page.locator('#dtcSignInForm button[type="submit"]').click(),
  ]);
  if (!landing.test(pathOf(page)))
    throw new Error(
      `The demo ${role} could not sign in at ${base.origin}. Start the DEMO app (APP_ENV=demo, port 8001) and run the setup script. Nothing was changed.`,
    );
  await page.close();
  await page.video().delete();
  return context;
};

const scenes = [];
const record = async (context, id, title, role, path, play) => {
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const actor = createActor(page);
  try {
    if (path) await page.goto(href(path), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await actor.wait(500);
    await page.mouse.move(1300, 760);
    const marker = await flash(actor);
    let trim = actor.now();
    await actor.wait(1200);
    const start = await play(actor, page);
    // A clip may ask to begin later, once its first page has loaded.
    if (start) trim = start;
    await actor.wait(1200);
    const end = actor.now();
    const video = page.video();
    await page.close();
    const file = `${String(scenes.length + 1).padStart(2, "0")}-${id}.webm`;
    await video.saveAs(`${out}/${file}`);
    await video.delete();
    const found = await findFlashEnd(browser, `${out}/${file}`, marker + 5);
    if (found === null)
      throw new Error("Could not find the timing flash in the recording.");
    // Convert every recorder time into a time inside the video file.
    const offset = marker - found;
    scenes.push({
      id,
      title,
      role,
      file,
      trim: trim - offset,
      end: end - offset,
      events: actor.events.map((event) => ({
        ...event,
        time: event.time - offset,
      })),
    });
    console.log(`✓ ${title} (${(end - trim).toFixed(1)}s)`);
  } catch (error) {
    await page.screenshot({ path: `${out}/error-${id}.png` }).catch(() => {});
    const messages = await page
      .locator(
        ".alert-danger:visible, .wiz-err-msg:visible, .dtc-modal-error:visible, .invalid-feedback:visible",
      )
      .allInnerTexts()
      .catch(() => []);
    console.error(
      `✗ Step "${title}" failed. Screenshot: ${out}/error-${id}.png`,
    );
    if (messages.length) console.error(`  Page says: ${messages.join(" | ")}`);
    throw error;
  }
};

const confirmDialog = (actor) => actor.submit("#dtcConfirmOk");
const search = (path) =>
  `${path}?search=${encodeURIComponent(applicant.email)}`;

try {
  const registrar = await signInStaff("registrar", /^\/registrar\/dashboard$/);
  const cashier = await signInStaff("cashier", /^\/cashier\/dashboard$/);
  writesEnabled = true;
  const visitor = await newContext();

  await record(
    visitor,
    "admission",
    "Online admission application",
    "Applicant",
    "/apply",
    async (actor, page) => {
      let step = 1;
      const next = async () => {
        await actor.click("#wizNext", 500);
        // The wizard stays put when a field is invalid.
        await page.locator(`#step-${++step}.active`).waitFor({ timeout: 8000 });
        await actor.wide(700);
      };
      await actor.choose("#academic_status", "new_student");
      await actor.choose("#program_id", { label: config.program });
      await next();
      await actor.type("#first_name", applicant.first);
      await actor.type("#last_name", applicant.last);
      await actor.type("#middle_name", applicant.middle);
      await actor.choose("#gender", "female");
      await actor.setValue("#birthdate", "2007-03-15");
      await next();
      await actor.type("#email", applicant.email);
      await actor.type("#city_text", "Danao");
      await actor.type("#current_address", "Demo Street, Purok 1");
      await next();
      await actor.choose("#education_level", "Senior High School");
      await actor.choose("#education_status", "Graduated");
      await actor.type("#most_recent_school", "Demo Senior High School");
      await next();
      await next(); // Family details are optional.
      await next(); // Document uploads are optional.
      await actor.wait(1500); // Review summary.
      await actor.click("#wizSubmit", 900);
      await confirmDialog(actor);
      expectPath(page, /^\/apply\/success$/);
      applicant.reference = (
        await page.locator(".application-reference-value").innerText()
      ).trim();
      await actor.wait(1500);
    },
  );

  await record(
    registrar,
    "application-review",
    "The Registrar approves the application",
    "Registrar",
    `/registrar/applications?search=${applicant.reference}`,
    async (actor, page) => {
      await actor.submit(
        'a.btn-primary[href*="/registrar/applications/"]:visible',
        2000,
      );
      await actor.click('[data-dtc-confirm-form^="#start-review-"]:visible');
      await confirmDialog(actor);
      await actor.click(
        '[data-dtc-confirm-form^="#approve-application-"]:visible',
      );
      await confirmDialog(actor);
      expectPath(page, /^\/registrar\/applications$/);
    },
  );

  // The link is a one-time secret: it is opened directly and never printed.
  const link = await activationLink();
  await record(
    visitor,
    "activation",
    "The applicant activates the account",
    "Applicant",
    null,
    async (actor, page) => {
      await page.goto(link, { waitUntil: "load" });
      const loaded = actor.now();
      await actor.wide(1200);
      await actor.type("#password", applicant.password);
      await actor.type("#password_confirmation", applicant.password);
      await actor.submit('form[action$="/set-password"] button[type="submit"]');
      expectPath(page, /^\/login$/);
      await fillLogin(actor, applicant);
      expectPath(page, /^\/portal\/dashboard$/);
      return loaded;
    },
  );

  await record(
    visitor,
    "enrollment",
    "The applicant submits an enrollment",
    "Applicant",
    "/portal/enrollment/create",
    async (actor, page) => {
      await page.locator('input[name="subject_ids[]"]').first().waitFor();
      await actor.wait(2000);
      await actor.submit(
        '.dtc-enrollment-create-actions button[type="submit"]',
        2800,
      );
      expectPath(page, /^\/portal\/enrollment$/);
    },
  );

  await record(
    registrar,
    "sections",
    "The Registrar assigns class sections",
    "Registrar",
    search("/registrar/enrollments"),
    async (actor, page) => {
      await actor.click(".dtc-review-btn:visible", 1200);
      const selects = page.locator(
        '#enrollmentReviewModal select[name^="section_choices"]',
      );
      await selects.first().waitFor();
      const ids = await selects.evaluateAll((nodes) => nodes.map((n) => n.id));
      for (const id of ids) await actor.choose(`#${id}`, { index: 1 });
      await actor.submit(
        'button[name="record_sections"].dtc-btn-primary:visible',
        2400,
      );
      expectPath(page, /^\/registrar\/enrollments\/\d+$/);
    },
  );

  await record(
    cashier,
    "payment",
    "The Cashier records the payment",
    "Cashier",
    search("/cashier/payments"),
    async (actor, page) => {
      await actor.click(".dtc-payment-btn:visible", 1800);
      await actor.click('[data-dtc-confirm-form^="#walkinForm-"]:visible');
      await confirmDialog(actor);
      await page.goto(href(search("/cashier/payments")), { waitUntil: "load" });
      await actor.wide(900);
      await actor.click(".dtc-receipt-btn:not([hidden]):visible", 1200);
      await actor.wide(3000);
    },
  );

  await record(
    registrar,
    "approval",
    "The Registrar approves the enrollment",
    "Registrar",
    search("/registrar/enrollments"),
    async (actor, page) => {
      await actor.click(".dtc-review-btn:visible", 1800);
      await actor.click(
        '[data-dtc-confirm-form^="#approve-enrollment-"]:visible',
      );
      await confirmDialog(actor);
      expectPath(page, /^\/registrar\/enrollments$/);
      // A refused approval returns to the searched list. Success drops the search.
      if (new URL(page.url()).searchParams.has("search"))
        throw new Error("The app did not approve the enrollment.");
    },
  );

  await record(
    visitor,
    "certificate",
    "The student gets a Certificate of Registration",
    "Student",
    "/portal/dashboard",
    async (actor, page) => {
      const welcome = page.locator("#studentWelcomeOpen");
      if (
        await welcome.waitFor({ state: "visible", timeout: 20000 }).then(
          () => true,
          () => false,
        )
      ) {
        await actor.wait(2200);
        await actor.click("#studentWelcomeOpen", 1800);
      }
      await page.goto(href("/portal/cor"), { waitUntil: "load" });
      expectPath(page, /^\/portal\/cor$/);
      await actor.wide(2500);
      await page.evaluate(() =>
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        }),
      );
      await actor.wait(3000);
    },
  );

  await writeFile(
    `${out}/flow.json`,
    JSON.stringify({ ...size, scenes }, null, 2) + "\n",
  );
  await rm(`${out}/raw`, { recursive: true, force: true });
  const total = scenes.reduce((sum, scene) => sum + scene.end - scene.trim, 0);
  console.log(
    `Recorded ${scenes.length} steps, ${total.toFixed(0)}s. Watch the clips before sharing the video.`,
  );
} finally {
  await browser.close();
}
