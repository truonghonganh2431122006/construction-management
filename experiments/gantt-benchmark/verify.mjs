import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { once } from "node:events";
import { createBenchmarkServer } from "./server.mjs";

// Reuse the project's existing browser dependency; no additional install needed.
const requireFrontend = createRequire(new URL("../../frontend/package.json", import.meta.url));
const { chromium } = requireFrontend("playwright");
const server = createBenchmarkServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
const baseURL = `http://127.0.0.1:${server.address().port}`;
let browser;
const measurements = [];

async function exportedReport(page) {
  const downloadReady = page.waitForEvent("download");
  await page.locator("#export").click();
  const download = await downloadReady;
  return JSON.parse(await readFile(await download.path(), "utf8"));
}

async function compare(page, count) {
  await page.locator("#runs").fill(String(count));
  await page.locator("#run-both").click();
  assert.equal(await page.locator("#run-svg").isDisabled(), true);
  assert.equal(await page.locator("#runs").isDisabled(), true);
  const visibleBox = await page.locator("#viewport").boundingBox();
  assert.ok(visibleBox.y >= 0 && visibleBox.y + visibleBox.height <= page.viewportSize().height);
  await page.waitForFunction(() => document.querySelector("#status").textContent.startsWith("Đã đo xong"), null, { timeout: 120000 });
  assert.equal(await page.locator("#metrics tbody tr").count(), 2);
  assert.equal(await page.locator("#run-svg").isEnabled(), true);
  const report = await exportedReport(page);
  assert.equal(report.method.barCount, 500);
  for (const result of report.results) {
    assert.equal(result.samples.length, count);
    for (const metric of ["setupMs", "readyMs", "fps", "lowFps", "p95FrameMs"]) assert.ok(Number.isFinite(result[metric]) && result[metric] > 0, metric);
    for (const sample of result.samples) {
      assert.ok(sample.scroll.elapsedMs >= 2000);
      assert.ok(sample.scroll.frames > 0);
      assert.ok(Math.abs(sample.scroll.furthestTop - sample.scroll.maxTop) <= 1);
      assert.ok(Math.abs(sample.scroll.furthestLeft - sample.scroll.maxLeft) <= 1);
    }
  }
  return report;
}

async function waitForStopped(page, message) {
  await page.waitForFunction((text) => document.querySelector("#status").textContent.includes(text), message);
  assert.equal(await page.locator("#run-both").isEnabled(), true);
}

try {
  const response = await fetch(`${baseURL}/benchmark.js`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /javascript/);
  assert.equal((await fetch(`${baseURL}/../../backend/package.json`)).status, 404);
  assert.equal((await fetch(`${baseURL}/README.md`)).status, 404);
  console.log("PASS: HTTP assets and restricted server root");

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, acceptDownloads: true });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(new URL("./index.html", import.meta.url).href);
  await page.waitForFunction(() => document.querySelector("#environment").textContent.length > 0);
  await page.locator("#runs").fill("1");
  await page.locator("#run-svg").click();
  await page.waitForFunction(() => document.querySelector("#status").textContent.startsWith("Đã đo xong"));
  assert.equal(await page.locator("#viewport svg rect").count(), 500);
  console.log("PASS: file:// opens and SVG renders exactly 500 bars");

  for (const invalid of ["", "0", "21", "1.5"]) {
    await page.locator("#runs").fill(invalid);
    await page.locator("#run-both").click();
    assert.match(await page.locator("#status").innerText(), /số nguyên từ 1 đến 20/);
    assert.equal(await page.locator("#run-both").isEnabled(), true);
  }
  await page.locator("#runs").fill("3");
  await page.locator("#run-both").click();
  await page.locator("#cancel").click();
  await waitForStopped(page, "Đã dừng đo");
  // Keep the prior valid result after cancelling a new measurement.
  assert.equal((await exportedReport(page)).results[0].kind, "svg");
  await page.locator("#run-both").click();
  await page.setViewportSize({ width: 1200, height: 720 });
  await waitForStopped(page, "kích thước màn hình thay đổi");
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.locator("#run-both").click();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    delete document.hidden;
  });
  await waitForStopped(page, "trang bị ẩn");
  console.log("PASS: invalid inputs, cancellation, resize and hidden-page interruption");

  await page.evaluate(() => {
    window.originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = () => null;
  });
  await page.locator("#run-canvas").click();
  await waitForStopped(page, "không tạo được Canvas 2D");
  await page.evaluate(() => {
    HTMLCanvasElement.prototype.getContext = window.originalGetContext;
    delete window.originalGetContext;
  });
  assert.deepEqual(errors, []);
  await page.goto(baseURL);
  await page.locator("#device-name").fill("Windows desktop · headless Chromium");
  await page.locator("#device-type").selectOption("desktop");
  const desktop = await compare(page, 5);
  measurements.push({ profile: "desktop-headless", physicalPhone: false, browserVersion: browser.version(), report: desktop });
  console.log("PASS: desktop comparison, 5 complete render + scroll samples per renderer");
  assert.deepEqual(errors, []);
  await page.close();

  for (const [profile, viewport] of [
    ["phone-portrait-emulation", { width: 390, height: 844 }],
    ["phone-landscape-emulation", { width: 844, height: 390 }]
  ]) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 3, isMobile: true, hasTouch: true, acceptDownloads: true });
    const mobile = await context.newPage();
    const mobileErrors = [];
    mobile.on("pageerror", (error) => mobileErrors.push(error.message));
    await mobile.goto(baseURL);
    await mobile.locator("#device-name").fill(profile);
    await mobile.locator("#device-type").selectOption("emulation");
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    const report = await compare(mobile, 3);
    const canvasResult = report.results.find((result) => result.kind === "canvas");
    assert.ok(canvasResult.backingStoreBytes < 15 * 1024 * 1024);
    // Make one dedicated Canvas run to inspect first and last rows at DPR 3.
    await mobile.locator("#runs").fill("1");
    await mobile.locator("#run-canvas").click();
    await mobile.waitForFunction(() => document.querySelector("#status").textContent.startsWith("Đã đo xong"));
    const pixels = await mobile.evaluate(async () => {
      const viewport = document.querySelector("#viewport");
      const canvas = viewport.querySelector("canvas");
      const ratio = canvas.width / 1000;
      const context = canvas.getContext("2d");
      const first = [...context.getImageData(Math.round(2 * ratio), Math.round(5 * ratio), 1, 1).data];
      viewport.scrollTop = viewport.scrollHeight - viewport.clientHeight;
      await new Promise((resolve) => setTimeout(resolve, 100));
      const lastX = (499 * 7) % 720 + 2;
      const lastY = 499 * 24 + 5 - viewport.scrollTop;
      const last = [...context.getImageData(Math.round(lastX * ratio), Math.round(lastY * ratio), 1, 1).data];
      return { first, last, width: canvas.width, height: canvas.height };
    });
    assert.deepEqual(pixels.first, [111, 167, 212, 255]);
    assert.deepEqual(pixels.last, [111, 167, 212, 255]);
    assert.ok(pixels.width <= 4096 && pixels.height <= 4096);
    assert.deepEqual(mobileErrors, []);
    measurements.push({ profile, physicalPhone: false, browserVersion: browser.version(), report });
    console.log(`PASS: ${profile}, both renderers, bounded bitmap and first/last row pixels`);
    await context.close();
  }

  const resultDirectory = new URL("./results/", import.meta.url);
  await mkdir(resultDirectory, { recursive: true });
  await writeFile(new URL("./results/automated.json", import.meta.url), `${JSON.stringify({ note: "Headless Windows Chromium measurements. Mobile profiles are emulation, not physical-phone acceptance.", measurements }, null, 2)}\n`);
  for (const { profile, report } of measurements) {
    console.log(profile, JSON.stringify(report.results.map(({ kind, setupMs, readyMs, fps, lowFps, p95FrameMs }) => ({ kind, setupMs, readyMs, fps, lowFps, p95FrameMs }))));
  }
  console.log("PASS: benchmark regression checks; raw measurements saved in results/automated.json");
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
