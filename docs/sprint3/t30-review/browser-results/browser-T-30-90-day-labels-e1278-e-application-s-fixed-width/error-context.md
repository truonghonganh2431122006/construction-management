# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: browser.spec.mjs >> T-30 90-day labels remain readable at the application's fixed width
- Location: ..\docs\sprint3\t30-review\browser.spec.mjs:86:1

# Error details

```
Error: Overlapping neighboring labels: [["Ngày 0","Ngày 1"],["Ngày 1","Ngày 2"],["Ngày 2","Ngày 3"],["Ngày 3","Ngày 4"],["Ngày 4","Ngày 5"]]

expect(received).toHaveLength(expected)

Expected length: 0
Received length: 90
Received array:  [["Ngày 0", "Ngày 1"], ["Ngày 1", "Ngày 2"], ["Ngày 2", "Ngày 3"], ["Ngày 3", "Ngày 4"], ["Ngày 4", "Ngày 5"], ["Ngày 5", "Ngày 6"], ["Ngày 6", "Ngày 7"], ["Ngày 7", "Ngày 8"], ["Ngày 8", "Ngày 9"], ["Ngày 9", "Ngày 10"], …]
```

# Page snapshot

```yaml
- region "Biểu đồ Gantt" [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]: Công việc
      - generic [ref=e8]:
        - generic [ref=e9]: Ngày 0
        - generic [ref=e10]: Ngày 1
        - generic [ref=e11]: Ngày 2
        - generic [ref=e12]: Ngày 3
        - generic [ref=e13]: Ngày 4
        - generic [ref=e14]: Ngày 5
        - generic [ref=e15]: Ngày 6
        - generic [ref=e16]: Ngày 7
        - generic [ref=e17]: Ngày 8
        - generic [ref=e18]: Ngày 9
        - generic [ref=e19]: Ngày 10
        - generic [ref=e20]: Ngày 11
        - generic [ref=e21]: Ngày 12
        - generic [ref=e22]: Ngày 13
        - generic [ref=e23]: Ngày 14
        - generic [ref=e24]: Ngày 15
        - generic [ref=e25]: Ngày 16
        - generic [ref=e26]: Ngày 17
        - generic [ref=e27]: Ngày 18
        - generic [ref=e28]: Ngày 19
        - generic [ref=e29]: Ngày 20
        - generic [ref=e30]: Ngày 21
        - generic [ref=e31]: Ngày 22
        - generic [ref=e32]: Ngày 23
        - generic [ref=e33]: Ngày 24
        - generic [ref=e34]: Ngày 25
        - generic [ref=e35]: Ngày 26
        - generic [ref=e36]: Ngày 27
        - generic [ref=e37]: Ngày 28
        - generic [ref=e38]: Ngày 29
        - generic [ref=e39]: Ngày 30
        - generic [ref=e40]: Ngày 31
        - generic [ref=e41]: Ngày 32
        - generic [ref=e42]: Ngày 33
        - generic [ref=e43]: Ngày 34
        - generic [ref=e44]: Ngày 35
        - generic [ref=e45]: Ngày 36
        - generic [ref=e46]: Ngày 37
        - generic [ref=e47]: Ngày 38
        - generic [ref=e48]: Ngày 39
        - generic [ref=e49]: Ngày 40
        - generic [ref=e50]: Ngày 41
        - generic [ref=e51]: Ngày 42
        - generic [ref=e52]: Ngày 43
        - generic [ref=e53]: Ngày 44
        - generic [ref=e54]: Ngày 45
        - generic [ref=e55]: Ngày 46
        - generic [ref=e56]: Ngày 47
        - generic [ref=e57]: Ngày 48
        - generic [ref=e58]: Ngày 49
        - generic [ref=e59]: Ngày 50
        - generic [ref=e60]: Ngày 51
        - generic [ref=e61]: Ngày 52
        - generic [ref=e62]: Ngày 53
        - generic [ref=e63]: Ngày 54
        - generic [ref=e64]: Ngày 55
        - generic [ref=e65]: Ngày 56
        - generic [ref=e66]: Ngày 57
        - generic [ref=e67]: Ngày 58
        - generic [ref=e68]: Ngày 59
        - generic [ref=e69]: Ngày 60
        - generic [ref=e70]: Ngày 61
        - generic [ref=e71]: Ngày 62
        - generic [ref=e72]: Ngày 63
        - generic [ref=e73]: Ngày 64
        - generic [ref=e74]: Ngày 65
        - generic [ref=e75]: Ngày 66
        - generic [ref=e76]: Ngày 67
        - generic [ref=e77]: Ngày 68
        - generic [ref=e78]: Ngày 69
        - generic [ref=e79]: Ngày 70
        - generic [ref=e80]: Ngày 71
        - generic [ref=e81]: Ngày 72
        - generic [ref=e82]: Ngày 73
        - generic [ref=e83]: Ngày 74
        - generic [ref=e84]: Ngày 75
        - generic [ref=e85]: Ngày 76
        - generic [ref=e86]: Ngày 77
        - generic [ref=e87]: Ngày 78
        - generic [ref=e88]: Ngày 79
        - generic [ref=e89]: Ngày 80
        - generic [ref=e90]: Ngày 81
        - generic [ref=e91]: Ngày 82
        - generic [ref=e92]: Ngày 83
        - generic [ref=e93]: Ngày 84
        - generic [ref=e94]: Ngày 85
        - generic [ref=e95]: Ngày 86
        - generic [ref=e96]: Ngày 87
        - generic [ref=e97]: Ngày 88
        - generic [ref=e98]: Ngày 89
        - generic [ref=e99]: Ngày 90
    - generic [ref=e100]:
      - generic "Đào móng" [ref=e101]
      - button "Đào móng — đường găng" [ref=e103] [cursor=pointer]:
        - generic [aria-hidden]: ◆
    - generic [ref=e104]:
      - generic "Đổ bê tông" [ref=e105]
      - button "Đổ bê tông — đường găng" [ref=e107] [cursor=pointer]:
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
  54 |     await expect(weekControl).not.toHaveCount(0, { timeout: 1000 });
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
> 93 |     expect(overlaps, `Overlapping neighboring labels: ${JSON.stringify(overlaps.slice(0, 5))}`).toHaveLength(0);
     |                                                                                                 ^ Error: Overlapping neighboring labels: [["Ngày 0","Ngày 1"],["Ngày 1","Ngày 2"],["Ngày 2","Ngày 3"],["Ngày 3","Ngày 4"],["Ngày 4","Ngày 5"]]
  94 | });
  95 | 
```