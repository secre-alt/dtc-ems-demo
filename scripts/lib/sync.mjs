// A recorded video starts at a slightly different moment than the recorder's
// clock, by an amount that varies between computers. Each clip therefore shows
// a short colour flash, and we measure where it landed in the saved file.
import { readFile } from "node:fs/promises";

const FLASH_ID = "demo-sync-flash";

// Returns the recorder time at which the flash was removed.
export const flash = async (actor) => {
  await actor.page.evaluate((id) => {
    const cover = document.createElement("div");
    cover.id = id;
    cover.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;background:#ff00ff";
    document.documentElement.append(cover);
  }, FLASH_ID);
  await actor.wait(500);
  const removed = actor.now();
  await actor.page.evaluate(
    (id) => document.getElementById(id).remove(),
    FLASH_ID,
  );
  await actor.wait(500);
  return removed;
};

// Returns the time in the video file at which the flash disappears.
export const findFlashEnd = async (browser, file, latest) => {
  const data = (await readFile(file)).toString("base64");
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.setContent("<video muted preload=auto></video>");
    return await page.evaluate(
      async ({ data, latest }) => {
        const video = document.querySelector("video");
        const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
        const once = (name) =>
          new Promise((resolve, reject) => {
            video.addEventListener(name, resolve, { once: true });
            video.addEventListener(
              "error",
              () => reject(new Error("Unreadable video")),
              { once: true },
            );
          });
        const loaded = once("loadeddata");
        video.src = URL.createObjectURL(
          new Blob([bytes], { type: "video/webm" }),
        );
        await loaded;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 8;
        const draw = canvas.getContext("2d", { willReadFrequently: true });
        let seen = false;
        for (let t = 0.001; t <= latest; t += 0.02) {
          const seeked = once("seeked");
          video.currentTime = t;
          await seeked;
          draw.drawImage(video, 0, 0, 8, 8);
          const [r, g, b] = draw.getImageData(2, 2, 1, 1).data;
          const magenta = r > 180 && g < 90 && b > 180;
          if (magenta) seen = true;
          else if (seen) return t;
        }
        return null;
      },
      { data, latest },
    );
  } finally {
    await context.close();
  }
};
