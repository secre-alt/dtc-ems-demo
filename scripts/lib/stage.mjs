// The on-screen cursor for recordings, plus hand-like mouse and typing helpers.

export const size = { width: 1920, height: 1080 };

// Runs in the page: draws a cursor (recordings have none) and hides payment
// account details and QR codes before they can appear in any frame.
export const overlay = () => {
  const install = () => {
    const style = document.createElement("style");
    style.textContent =
      '.dtc-gcash-account,.dr-gcash-transfer,.dr-gcash-qr,img[alt*="QR"],img[src*="gcash-qr"],img[src*="gcash/qr"]{visibility:hidden!important}';
    const cursor = document.createElement("div");
    cursor.innerHTML =
      '<svg width="30" height="36" viewBox="0 0 30 36"><path d="M2 2V29L9 22L15 34L21 31L15 20H27Z" fill="#141820" stroke="#fff" stroke-width="2"/></svg>';
    cursor.style.cssText =
      "position:fixed;left:-60px;top:-60px;z-index:2147483647;pointer-events:none";
    // The last position survives page loads, so the cursor does not vanish.
    try {
      const last = JSON.parse(sessionStorage.getItem("demo-cursor"));
      if (last) {
        cursor.style.left = `${last[0]}px`;
        cursor.style.top = `${last[1]}px`;
      }
    } catch {
      /* The cursor reappears on the next move. */
    }
    document.documentElement.append(style, cursor);
    addEventListener(
      "mousemove",
      (e) => {
        const at = [e.clientX - 2, e.clientY - 2];
        cursor.style.left = `${at[0]}px`;
        cursor.style.top = `${at[1]}px`;
        try {
          sessionStorage.setItem("demo-cursor", JSON.stringify(at));
        } catch {
          /* Optional. */
        }
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

// One recorded page. Times are seconds from the start of its video file.
export const createActor = (page) => {
  const started = Date.now();
  const events = [];
  const now = () => (Date.now() - started) / 1000;
  const wait = (ms) => page.waitForTimeout(ms);
  let mouse = { x: 1300, y: 760 };

  const moveTo = async (x, y) => {
    const from = mouse;
    const steps = 28;
    for (let i = 1; i <= steps; i++) {
      const p = i / steps;
      const e = p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
      await page.mouse.move(
        from.x + (x - from.x) * e,
        from.y + (y - from.y) * e,
      );
      await wait(14);
    }
    mouse = { x, y };
  };

  // Moves to a control and returns it, scrolling only when needed.
  const approach = async (selector) => {
    const target = page.locator(selector).first();
    await target.waitFor({ state: "visible" });
    const inView = await target.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.top > 90 && r.bottom < innerHeight - 90;
    });
    if (!inView) {
      await target.evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "smooth" }),
      );
      await wait(700);
    }
    // Wait for dialogs and scrolling to stop moving.
    let box = await target.boundingBox();
    for (let i = 0; i < 20; i++) {
      await wait(100);
      const next = await target.boundingBox();
      const still =
        Math.abs(next.x - box.x) < 1 && Math.abs(next.y - box.y) < 1;
      box = next;
      if (still) break;
    }
    const x = box.x + Math.min(box.width * 0.5, 180);
    const y = box.y + box.height / 2;
    await moveTo(x, y);
    await wait(180);
    // Fails if something else would receive the click.
    await target.click({
      trial: true,
      position: { x: x - box.x, y: box.height / 2 },
    });
    return { target, x, y };
  };

  const click = async (selector, after = 700) => {
    const { x, y } = await approach(selector);
    events.push({ type: "click", time: now(), x, y });
    await page.mouse.down();
    await wait(80);
    await page.mouse.up();
    await wait(after);
  };

  // A click that loads a new page. The camera pulls back to show the result.
  const submit = async (selector, hold = 1800) => {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 60000 }),
      click(selector, 0),
    ]);
    await page.evaluate(() => document.fonts.ready);
    events.push({ type: "wide", time: now() });
    await wait(hold);
  };

  const keys = async (text, delay = 42) => {
    for (const char of text) {
      events.push({ type: "key", time: now() });
      await page.keyboard.type(char);
      await wait(delay);
    }
    await wait(250);
  };

  const type = async (selector, text) => {
    await click(selector, 150);
    await keys(text);
  };

  // Native menus and date pickers are not captured in headless video, so the
  // cursor clicks the field and the value appears in place.
  const choose = async (selector, option) => {
    const { target, x, y } = await approach(selector);
    events.push({ type: "click", time: now(), x, y });
    await target.selectOption(option);
    await wait(550);
  };
  const setValue = async (selector, value) => {
    const { target, x, y } = await approach(selector);
    events.push({ type: "click", time: now(), x, y });
    await target.fill(value);
    await target.blur();
    await wait(550);
  };

  const wide = async (hold = 1500) => {
    events.push({ type: "wide", time: now() });
    await wait(hold);
  };

  return {
    page,
    events,
    now,
    wait,
    click,
    submit,
    keys,
    type,
    choose,
    setValue,
    wide,
  };
};
