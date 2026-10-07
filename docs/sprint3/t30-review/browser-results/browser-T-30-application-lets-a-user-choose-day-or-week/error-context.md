# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: browser.spec.mjs >> T-30 application lets a user choose day or week
- Location: ..\docs\sprint3\t30-review\browser.spec.mjs:48:1

# Error details

```
Error: expect(locator).not.toHaveCount(expected) failed

Locator:  getByRole('combobox').or(getByRole('button', { name: /Tuần/ })).or(getByRole('radio', { name: /Tuần/ })).or(getByRole('tab', { name: /Tuần/ }))
Expected: not 0
Received: 0
Timeout:  1000ms

Call log:
  - Expect "not toHaveCount" getByRole('combobox').or(getByRole('button', { name: /Tuần/ })).or(getByRole('radio', { name: /Tuần/ })).or(getByRole('tab', { name: /Tuần/ })) with timeout 1000ms
  - waiting for getByRole('combobox').or(getByRole('button', { name: /Tuần/ })).or(getByRole('radio', { name: /Tuần/ })).or(getByRole('tab', { name: /Tuần/ }))
    10 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - heading "Tiến độ công việc" [level=1] [ref=e8]
        - paragraph [ref=e9]: "Dự án #37"
      - link "Quay lại cây hạng mục" [ref=e10] [cursor=pointer]:
        - /url: /work-items?projectId=37
    - paragraph [ref=e11]: Các mốc tính bằng ngày kể từ lúc khởi công (Ngày 0). Độ trễ là số ngày có thể trì hoãn; công việc găng có độ trễ bằng 0.
    - generic [ref=e12]:
      - generic [ref=e13] [cursor=pointer]:
        - checkbox "Chỉ hiện công việc găng" [ref=e15]
        - generic [ref=e16]: Chỉ hiện công việc găng
      - button "Tải lại" [ref=e17] [cursor=pointer]
    - table [ref=e25]:
      - rowgroup [ref=e26]:
        - row [ref=e27]:
          - columnheader "Tên công việc" [ref=e28]
          - columnheader "Thời lượng" [ref=e29]
          - columnheader "Khởi sớm (ES)" [ref=e30]
          - columnheader "Kết sớm (EF)" [ref=e31]
          - columnheader "Khởi muộn (LS)" [ref=e32]
          - columnheader "Kết muộn (LF)" [ref=e33]
          - columnheader "Độ trễ" [ref=e34]
          - columnheader "Trạng thái" [ref=e35]
      - rowgroup [ref=e36]:
        - row [ref=e37] [cursor=pointer]:
          - cell "Đào móng" [ref=e38]
          - cell "7 ngày" [ref=e39]
          - cell "Ngày 0" [ref=e40]
          - cell "Ngày 7" [ref=e41]
          - cell "Ngày 0" [ref=e42]
          - cell "Ngày 7" [ref=e43]
          - cell "0 ngày" [ref=e44]
          - cell "Găng" [ref=e45]
        - row [ref=e47] [cursor=pointer]:
          - cell "Đổ bê tông" [ref=e48]
          - cell "7 ngày" [ref=e49]
          - cell "Ngày 7" [ref=e50]
          - cell "Ngày 14" [ref=e51]
          - cell "Ngày 7" [ref=e52]
          - cell "Ngày 14" [ref=e53]
          - cell "0 ngày" [ref=e54]
          - cell "Găng" [ref=e55]
    - generic [ref=e57]:
      - heading "Gantt" [level=2] [ref=e58]
      - region "Biểu đồ Gantt" [ref=e59]:
        - generic [ref=e61]:
          - generic [ref=e62]:
            - generic [ref=e63]: Công việc
            - generic [ref=e64]:
              - generic [ref=e65]: Ngày 0
              - generic [ref=e66]: Ngày 1
              - generic [ref=e67]: Ngày 2
              - generic [ref=e68]: Ngày 3
              - generic [ref=e69]: Ngày 4
              - generic [ref=e70]: Ngày 5
              - generic [ref=e71]: Ngày 6
              - generic [ref=e72]: Ngày 7
              - generic [ref=e73]: Ngày 8
              - generic [ref=e74]: Ngày 9
              - generic [ref=e75]: Ngày 10
              - generic [ref=e76]: Ngày 11
              - generic [ref=e77]: Ngày 12
              - generic [ref=e78]: Ngày 13
              - generic [ref=e79]: Ngày 14
          - generic [ref=e80]:
            - generic "Đào móng" [ref=e81]
            - button "Đào móng — đường găng" [ref=e83] [cursor=pointer]:
              - generic [aria-hidden]: ◆
          - generic [ref=e84]:
            - generic "Đổ bê tông" [ref=e85]
            - button "Đổ bê tông — đường găng" [ref=e87] [cursor=pointer]:
              - generic [aria-hidden]: ◆
```

# Test source

```ts
  1  | import { createRequire } from "node:module";
  2  | const requireFrontend = createRequire(new URL("../../../frontend/package.json", import.meta.url));
  3  | const { test, expect } = requireFrontend("@playwright/test");
  4  | 
  5  | const tasks = [
  6  |     { id: 41, name: "Đào móng", duration_days: 7, es: 0, ef: 7, ls: 0, lf: 7, slack: 0, isCritical: true },
  7  |     { id: 42, name: "Đổ bê tông", duration_days: 7, es: 7, ef: 14, ls: 7, lf: 14, slack: 0, isCritical: true }
  8  | ];
  9  | 
  10 | async function openSchedule(page) {
  11 |     await page.route("**/projects/37/schedule*", (route) => route.fulfill({ json: { schedule: tasks } }));
  12 |     await page.goto("/schedule?projectId=37");
  13 |     await expect(page.locator(".gantt-row")).toHaveCount(2);
  14 | }
  15 | 
  16 | // Mount the real component through Vite in a review fixture; do not alter application files.
  17 | async function mountGantt(page, props) {
  18 |     await page.goto("/");
  19 |     const source = await (await page.request.get("/src/main.jsx")).text();
  20 |     const reactURL = source.match(/from\s+["']([^"']*\/react\.js[^"']*)["']/)?.[1];
  21 |     const clientURL = source.match(/from\s+["']([^"']*\/react-dom_client\.js[^"']*)["']/)?.[1];
  22 |     expect(reactURL).toBeTruthy();
  23 |     expect(clientURL).toBeTruthy();
  24 |     await page.evaluate(async ({ reactURL, clientURL, props }) => {
  25 |         const [{ default: React }, client, { default: Gantt }] = await Promise.all([
  26 |             import(reactURL), import(clientURL), import("/src/features/gantt/Gantt.jsx")
  27 |         ]);
  28 |         const createRoot = client.createRoot || client.default.createRoot;
  29 |         const host = document.createElement("div");
  30 |         document.body.replaceChildren(host);
  31 |         const root = createRoot(host);
  32 |         window.t30Render = (nextProps) => root.render(React.createElement(Gantt, nextProps));
  33 |         window.t30Render(props);
  34 |     }, { reactURL, clientURL, props });
  35 |     await expect(page.locator(".gantt-row")).toHaveCount(props.tasks.length);
  36 | }
  37 | 
  38 | async function positions(page) {
  39 |     return page.locator(".gantt-bar").evaluateAll((nodes) => nodes.map((node) => ({ left: node.style.left, width: node.style.width })));
  40 | }
  41 | 
  42 | async function assertGridAlignment(page) {
  43 |     const axis = await page.locator(".gantt-axis .gantt-gridline").evaluateAll((nodes) => nodes.map((node) => node.style.left));
  44 |     const body = await page.locator(".gantt-body-gridlines .gantt-gridline").evaluateAll((nodes) => nodes.map((node) => node.style.left));
  45 |     expect(axis).toEqual(body);
  46 | }
  47 | 
  48 | test("T-30 application lets a user choose day or week", async ({ page }) => {
  49 |     await openSchedule(page);
  50 |     await expect(page.locator(".gantt-axis span")).toHaveCount(15);
  51 |     // Accept a select, accessible buttons/radios, or a tab switch.
  52 |     const weekControl = page.getByRole("combobox").or(page.getByRole("button", { name: /Tuần/ }))
  53 |         .or(page.getByRole("radio", { name: /Tuần/ })).or(page.getByRole("tab", { name: /Tuần/ }));
> 54 |     await expect(weekControl).not.toHaveCount(0, { timeout: 1000 });
     |                                   ^ Error: expect(locator).not.toHaveCount(expected) failed
  55 | });
  56 | 
  57 | test("T-30 component switches actual numeric ticks and gridlines without moving bars", async ({ page }) => {
  58 |     const props = { tasks, start: 0, end: 14, width: 700, unit: "day" };
  59 |     await mountGantt(page, props);
  60 |     await expect(page.locator(".gantt-axis span")).toHaveText(Array.from({ length: 15 }, (_, day) => `Ngày ${day}`));
  61 |     const before = await positions(page);
  62 |     expect(before).toEqual([{ left: "0px", width: "350px" }, { left: "350px", width: "350px" }]);
  63 |     await assertGridAlignment(page);
  64 |     await page.evaluate((props) => window.t30Render(props), { ...props, unit: "week" });
  65 |     await expect(page.locator(".gantt-axis span")).toHaveText(["Tuần 1", "Tuần 2", "Tuần 3"]);
  66 |     expect(await positions(page)).toEqual(before);
  67 |     await assertGridAlignment(page);
  68 |     await page.evaluate((props) => window.t30Render(props), props);
  69 |     await expect(page.locator(".gantt-axis span")).toHaveCount(15);
  70 | });
  71 | 
  72 | test("T-30 calendar ticks switch across month boundary at mobile viewport", async ({ page }) => {
  73 |     await page.setViewportSize({ width: 390, height: 844 });
  74 |     const props = { tasks, startDate: "2024-02-25", endDate: "2024-03-10", width: 700, unit: "day" };
  75 |     await mountGantt(page, props);
  76 |     await expect(page.locator(".gantt-axis span")).toHaveText([
  77 |         "25/02", "26/02", "27/02", "28/02", "29/02", "01/03", "02/03", "03/03", "04/03", "05/03", "06/03", "07/03", "08/03", "09/03", "10/03"
  78 |     ]);
  79 |     const before = await positions(page);
  80 |     await page.evaluate((props) => window.t30Render(props), { ...props, unit: "week" });
  81 |     await expect(page.locator(".gantt-axis span")).toHaveText(["Tuần 1", "Tuần 2", "Tuần 3"]);
  82 |     expect(await positions(page)).toEqual(before);
  83 |     await assertGridAlignment(page);
  84 | });
  85 | 
  86 | test("T-30 90-day labels remain readable at the application's fixed width", async ({ page }) => {
  87 |     await mountGantt(page, { tasks, start: 0, end: 90, width: 1200, unit: "day" });
  88 |     const overlaps = await page.locator(".gantt-axis span").evaluateAll((nodes) => {
  89 |         const boxes = nodes.map((node) => ({ label: node.textContent, left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right }));
  90 |         return boxes.slice(1).flatMap((box, index) => boxes[index].right > box.left ? [[boxes[index].label, box.label]] : []);
  91 |     });
  92 |     await page.screenshot({ path: test.info().outputPath("90-day-axis.png"), fullPage: true });
  93 |     expect(overlaps, `Overlapping neighboring labels: ${JSON.stringify(overlaps.slice(0, 5))}`).toHaveLength(0);
  94 | });
  95 | 
```