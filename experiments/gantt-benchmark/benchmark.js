(() => {
  "use strict";

  const BAR_COUNT = 500;
  const WIDTH = 1000;
  const ROW_HEIGHT = 24;
  const HEIGHT = BAR_COUNT * ROW_HEIGHT;
  const SCROLL_DURATION_MS = 2000;
  const data = Array.from({ length: BAR_COUNT }, (_, index) => Object.freeze({
    id: index + 1,
    x: (index * 7) % 720,
    y: index * ROW_HEIGHT + 2,
    width: 5 + (index % 30),
    height: 18
  }));
  const viewport = document.querySelector("#viewport");
  const metrics = document.querySelector("#metrics");
  const status = document.querySelector("#status");
  const runsInput = document.querySelector("#runs");
  const deviceNameInput = document.querySelector("#device-name");
  const deviceTypeInput = document.querySelector("#device-type");
  const runButtons = ["svg", "canvas", "both"].map((kind) => document.querySelector(`#run-${kind}`));
  const cancelButton = document.querySelector("#cancel");
  const exportButton = document.querySelector("#export");
  let activeController = null;
  let currentRenderer = null;
  let report = null;

  const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const percentile = (values, fraction) => [...values].sort((a, b) => a - b)[Math.ceil(values.length * fraction) - 1];
  const aborted = (signal) => { if (signal.aborted) throw signal.reason; };

  function environment() {
    return {
      deviceName: deviceNameInput.value.trim() || null,
      deviceType: deviceTypeInput.value,
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      visibleViewport: { width: window.visualViewport?.width ?? window.innerWidth, height: window.visualViewport?.height ?? window.innerHeight },
      scrollViewport: { width: viewport.clientWidth, height: viewport.clientHeight },
      devicePixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerWidth > window.innerHeight ? "landscape" : "portrait",
      hardwareConcurrency: navigator.hardwareConcurrency || null
    };
  }

  function showEnvironment() {
    const info = environment();
    document.querySelector("#environment").textContent = `${info.viewport.width} × ${info.viewport.height} · DPR ${info.devicePixelRatio} · ${info.orientation} · ${info.userAgent}`;
  }

  function nextFrame(signal) {
    aborted(signal);
    return new Promise((resolve, reject) => {
      const id = requestAnimationFrame((timestamp) => {
        signal.removeEventListener("abort", onAbort);
        resolve(timestamp);
      });
      function onAbort() {
        cancelAnimationFrame(id);
        reject(signal.reason);
      }
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  function disposeRenderer() {
    currentRenderer?.dispose();
    currentRenderer = null;
    viewport.replaceChildren();
    viewport.scrollTo(0, 0);
  }

  function renderSvg() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);
    svg.setAttribute("width", String(WIDTH));
    svg.setAttribute("height", String(HEIGHT));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "500 thanh Gantt bằng SVG");
    svg.setAttribute("fill", "#6fa7d4");
    svg.setAttribute("stroke", "#3977ad");
    for (const bar of data) {
      const rect = document.createElementNS(svg.namespaceURI, "rect");
      for (const attribute of ["x", "y", "width", "height"]) rect.setAttribute(attribute, String(bar[attribute]));
      svg.append(rect);
    }
    viewport.replaceChildren(svg);
    return { paint() {}, dispose() {}, backingStoreBytes: 0, scale: null };
  }

  function renderCanvas() {
    const stage = document.createElement("div");
    stage.className = "stage";
    const canvas = document.createElement("canvas");
    // Bound the bitmap to the visible height, even on high-DPR phones.
    const ratio = Math.min(window.devicePixelRatio || 1, 4);
    const height = viewport.clientHeight;
    canvas.width = Math.ceil(WIDTH * ratio);
    canvas.height = Math.ceil(height * ratio);
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${height}px`;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "500 thanh Gantt bằng Canvas");
    canvas.dataset.barCount = String(BAR_COUNT);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Trình duyệt không tạo được Canvas 2D. Hãy thử SVG hoặc tải lại trang.");
    let lastTop = -1;
    let pendingFrame = null;
    function paint() {
      const top = viewport.scrollTop;
      if (top === lastTop) return;
      lastTop = top;
      canvas.style.top = `${top}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, WIDTH, height);
      context.translate(0, -top);
      context.fillStyle = "#6fa7d4";
      context.strokeStyle = "#3977ad";
      // Submit all 500 rectangles. The bitmap clips rows outside the viewport.
      for (const bar of data) {
        context.fillRect(bar.x, bar.y, bar.width, bar.height);
        context.strokeRect(bar.x, bar.y, bar.width, bar.height);
      }
    }
    function onScroll() {
      if (pendingFrame !== null) return;
      pendingFrame = requestAnimationFrame(() => { pendingFrame = null; paint(); });
    }
    stage.append(canvas);
    viewport.replaceChildren(stage);
    viewport.addEventListener("scroll", onScroll, { passive: true });
    paint();
    return {
      paint,
      scale: ratio,
      backingStoreBytes: canvas.width * canvas.height * 4,
      dispose() {
        viewport.removeEventListener("scroll", onScroll);
        if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
        // Release the old bitmap before creating another one.
        canvas.width = 0;
        canvas.height = 0;
      }
    };
  }

  async function measureRender(kind, signal) {
    disposeRenderer();
    await nextFrame(signal);
    const started = performance.now();
    currentRenderer = kind === "svg" ? renderSvg() : renderCanvas();
    const setupMs = performance.now() - started;
    // Two callbacks allow a paint opportunity between them. This is a wall-time
    // estimate, not an assertion that the GPU has finished rendering.
    await nextFrame(signal);
    await nextFrame(signal);
    return { setupMs, readyMs: performance.now() - started };
  }

  async function measureScroll(signal) {
    viewport.scrollTo(0, 0);
    currentRenderer.paint();
    let previous = await nextFrame(signal);
    const started = previous;
    const intervals = [];
    const maxTop = viewport.scrollHeight - viewport.clientHeight;
    const maxLeft = viewport.scrollWidth - viewport.clientWidth;
    let furthestTop = 0;
    let furthestLeft = 0;
    while (previous - started < SCROLL_DURATION_MS) {
      const now = await nextFrame(signal);
      intervals.push(now - previous);
      previous = now;
      const progress = Math.min(1, (now - started) / SCROLL_DURATION_MS);
      const position = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      // Snap the midpoint once so every run actually visits the final row.
      const crossesMiddle = progress >= 0.5 && (now - intervals.at(-1) - started) / SCROLL_DURATION_MS < 0.5;
      viewport.scrollTo(maxLeft * (crossesMiddle ? 1 : position), maxTop * (crossesMiddle ? 1 : position));
      currentRenderer.paint();
      furthestTop = Math.max(furthestTop, viewport.scrollTop);
      furthestLeft = Math.max(furthestLeft, viewport.scrollLeft);
    }
    viewport.scrollTo(0, 0);
    currentRenderer.paint();
    const elapsedMs = previous - started;
    return {
      elapsedMs,
      frames: intervals.length,
      fps: 1000 / average(intervals),
      lowFps: 1000 / Math.max(...intervals),
      p95FrameMs: percentile(intervals, 0.95),
      intervalsMs: intervals,
      maxTop, maxLeft, furthestTop, furthestLeft
    };
  }

  function summarize(kind, samples) {
    const intervals = samples.flatMap((sample) => sample.scroll.intervalsMs);
    return {
      kind,
      runs: samples.length,
      setupMs: average(samples.map((sample) => sample.setupMs)),
      readyMs: average(samples.map((sample) => sample.readyMs)),
      fps: 1000 / average(intervals),
      lowFps: 1000 / Math.max(...intervals),
      p95FrameMs: percentile(intervals, 0.95),
      canvasScale: samples[0].canvasScale,
      backingStoreBytes: samples[0].backingStoreBytes,
      samples
    };
  }

  function showResults(results) {
    const table = document.createElement("table");
    const head = table.createTHead().insertRow();
    for (const label of ["Phương án", "Lượt", "Dựng/vẽ (ms)", "Đến sau frame (ms)", "FPS TB", "FPS thấp nhất", "Frame p95 (ms)"]) {
      const cell = document.createElement("th");
      cell.scope = "col";
      cell.textContent = label;
      head.append(cell);
    }
    const body = table.createTBody();
    for (const result of results) {
      const row = body.insertRow();
      row.dataset.kind = result.kind;
      const values = [result.kind === "svg" ? "SVG" : "Canvas", result.runs, result.setupMs.toFixed(2), result.readyMs.toFixed(2), result.fps.toFixed(1), result.lowFps.toFixed(1), result.p95FrameMs.toFixed(2)];
      for (const value of values) row.insertCell().textContent = String(value);
    }
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    wrapper.append(table);
    const details = document.createElement("p");
    details.className = "muted";
    const info = report.environment;
    details.textContent = `Lần đo: ${new Date(report.measuredAt).toLocaleString("vi-VN")} · ${info.deviceName || "Chưa đặt tên thiết bị"} · ${info.deviceType} · ${info.viewport.width} × ${info.viewport.height} · DPR ${info.devicePixelRatio} · ${info.orientation}`;
    metrics.replaceChildren(wrapper, details);
  }

  function setBusy(busy) {
    runButtons.forEach((button) => { button.disabled = busy; });
    runsInput.disabled = busy;
    deviceNameInput.disabled = busy;
    deviceTypeInput.disabled = busy;
    cancelButton.disabled = !busy;
    exportButton.disabled = busy || !report;
    viewport.setAttribute("aria-busy", String(busy));
  }

  async function run(kinds) {
    if (activeController) return;
    if (!runsInput.checkValidity()) {
      status.textContent = "Số lần chạy phải là số nguyên từ 1 đến 20.";
      status.dataset.error = "true";
      runsInput.reportValidity();
      return;
    }
    if (document.hidden) return;
    const count = Number(runsInput.value);
    // Measure visible content, including when mobile controls occupy a tall page.
    viewport.scrollIntoView({ block: "center", behavior: "instant" });
    const controller = new AbortController();
    activeController = controller;
    const { signal } = controller;
    setBusy(true);
    status.dataset.error = "false";
    const samples = Object.fromEntries(kinds.map((kind) => [kind, []]));
    const info = environment();
    try {
      for (const kind of kinds) {
        status.textContent = `Làm nóng ${kind.toUpperCase()}…`;
        await measureRender(kind, signal);
      }
      // Alternate the first renderer to reduce ordering bias between samples.
      for (let index = 0; index < count; index += 1) {
        const order = index % 2 === 0 ? kinds : [...kinds].reverse();
        for (const kind of order) {
          status.textContent = `Đang đo ${kind.toUpperCase()} · lượt ${index + 1}/${count}…`;
          const render = await measureRender(kind, signal);
          const { backingStoreBytes, scale } = currentRenderer;
          const scroll = await measureScroll(signal);
          samples[kind].push({ ...render, scroll, backingStoreBytes, canvasScale: scale });
        }
      }
      aborted(signal);
      report = {
        schemaVersion: 1,
        measuredAt: new Date().toISOString(),
        environment: info,
        method: { barCount: BAR_COUNT, width: WIDTH, height: HEIGHT, scrollDurationMs: SCROLL_DURATION_MS, warmupRuns: 1, canvas: "viewport bitmap; submit all 500 rectangles on scroll; DPR capped at 4", fps: "requestAnimationFrame callback intervals; not GPU frame counts" },
        results: kinds.map((kind) => summarize(kind, samples[kind]))
      };
      showResults(report.results);
      status.textContent = "Đã đo xong. Có thể tải JSON để lưu số liệu từng lượt và thông tin thiết bị.";
    } catch (error) {
      status.dataset.error = "true";
      status.textContent = signal.aborted ? String(signal.reason.message) : `Không đo được: ${error.message}`;
      disposeRenderer();
    } finally {
      activeController = null;
      setBusy(false);
    }
  }

  function stop(message) {
    activeController?.abort(new Error(message));
  }

  document.querySelector("#run-svg").addEventListener("click", () => run(["svg"]));
  document.querySelector("#run-canvas").addEventListener("click", () => run(["canvas"]));
  document.querySelector("#run-both").addEventListener("click", () => run(["svg", "canvas"]));
  cancelButton.addEventListener("click", () => stop("Đã dừng đo; lượt chưa hoàn tất không được lưu."));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop("Đã dừng vì trang bị ẩn. Giữ trang ở phía trước rồi đo lại.");
  });
  window.addEventListener("resize", () => {
    if (activeController) stop("Đã dừng vì kích thước màn hình thay đổi. Giữ nguyên hướng màn hình rồi đo lại.");
    else disposeRenderer();
    showEnvironment();
  });
  exportButton.addEventListener("click", () => {
    if (!report || activeController) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `gantt-benchmark-${report.measuredAt.replace(/[:.]/g, "-")}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  showEnvironment();
})();
