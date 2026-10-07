import { createRequire } from "node:module";
const requireFrontend = createRequire(new URL("../../../frontend/package.json", import.meta.url));
const { test, expect } = requireFrontend("@playwright/test");

const tasks = [
    { id: 41, name: "Đào móng", duration_days: 7, es: 0, ef: 7, ls: 0, lf: 7, slack: 0, isCritical: true },
    { id: 42, name: "Đổ bê tông", duration_days: 7, es: 7, ef: 14, ls: 7, lf: 14, slack: 0, isCritical: true }
];

async function openSchedule(page) {
    await page.route("**/projects/37/schedule*", (route) => route.fulfill({ json: { schedule: tasks } }));
    await page.goto("/schedule?projectId=37");
    await expect(page.locator(".gantt-row")).toHaveCount(2);
}

// Mount the real component through Vite in a review fixture; do not alter application files.
async function mountGantt(page, props) {
    await page.goto("/");
    const source = await (await page.request.get("/src/main.jsx")).text();
    const reactURL = source.match(/from\s+["']([^"']*\/react\.js[^"']*)["']/)?.[1];
    const clientURL = source.match(/from\s+["']([^"']*\/react-dom_client\.js[^"']*)["']/)?.[1];
    expect(reactURL).toBeTruthy();
    expect(clientURL).toBeTruthy();
    await page.evaluate(async ({ reactURL, clientURL, props }) => {
        const [{ default: React }, client, { default: Gantt }] = await Promise.all([
            import(reactURL), import(clientURL), import("/src/features/gantt/Gantt.jsx")
        ]);
        const createRoot = client.createRoot || client.default.createRoot;
        const host = document.createElement("div");
        document.body.replaceChildren(host);
        const root = createRoot(host);
        window.t30Render = (nextProps) => root.render(React.createElement(Gantt, nextProps));
        window.t30Render(props);
    }, { reactURL, clientURL, props });
    await expect(page.locator(".gantt-row")).toHaveCount(props.tasks.length);
}

async function positions(page) {
    return page.locator(".gantt-bar").evaluateAll((nodes) => nodes.map((node) => ({ left: node.style.left, width: node.style.width })));
}

async function assertGridAlignment(page) {
    const axis = await page.locator(".gantt-axis .gantt-gridline").evaluateAll((nodes) => nodes.map((node) => node.style.left));
    const body = await page.locator(".gantt-body-gridlines .gantt-gridline").evaluateAll((nodes) => nodes.map((node) => node.style.left));
    expect(axis).toEqual(body);
}

test("T-30 application lets a user choose day or week", async ({ page }) => {
    await openSchedule(page);
    await expect(page.locator(".gantt-axis span")).toHaveCount(15);
    // Accept a select, accessible buttons/radios, or a tab switch.
    const weekControl = page.getByRole("combobox").or(page.getByRole("button", { name: /Tuần/ }))
        .or(page.getByRole("radio", { name: /Tuần/ })).or(page.getByRole("tab", { name: /Tuần/ }));
    await expect(weekControl).not.toHaveCount(0, { timeout: 1000 });
});

test("T-30 component switches actual numeric ticks and gridlines without moving bars", async ({ page }) => {
    const props = { tasks, start: 0, end: 14, width: 700, unit: "day" };
    await mountGantt(page, props);
    await expect(page.locator(".gantt-axis span")).toHaveText(Array.from({ length: 15 }, (_, day) => `Ngày ${day}`));
    const before = await positions(page);
    expect(before).toEqual([{ left: "0px", width: "350px" }, { left: "350px", width: "350px" }]);
    await assertGridAlignment(page);
    await page.evaluate((props) => window.t30Render(props), { ...props, unit: "week" });
    await expect(page.locator(".gantt-axis span")).toHaveText(["Tuần 1", "Tuần 2", "Tuần 3"]);
    expect(await positions(page)).toEqual(before);
    await assertGridAlignment(page);
    await page.evaluate((props) => window.t30Render(props), props);
    await expect(page.locator(".gantt-axis span")).toHaveCount(15);
});

test("T-30 calendar ticks switch across month boundary at mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const props = { tasks, startDate: "2024-02-25", endDate: "2024-03-10", width: 700, unit: "day" };
    await mountGantt(page, props);
    await expect(page.locator(".gantt-axis span")).toHaveText([
        "25/02", "26/02", "27/02", "28/02", "29/02", "01/03", "02/03", "03/03", "04/03", "05/03", "06/03", "07/03", "08/03", "09/03", "10/03"
    ]);
    const before = await positions(page);
    await page.evaluate((props) => window.t30Render(props), { ...props, unit: "week" });
    await expect(page.locator(".gantt-axis span")).toHaveText(["Tuần 1", "Tuần 2", "Tuần 3"]);
    expect(await positions(page)).toEqual(before);
    await assertGridAlignment(page);
});

test("T-30 90-day labels remain readable at the application's fixed width", async ({ page }) => {
    await mountGantt(page, { tasks, start: 0, end: 90, width: 1200, unit: "day" });
    const overlaps = await page.locator(".gantt-axis span").evaluateAll((nodes) => {
        const boxes = nodes.map((node) => ({ label: node.textContent, left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right }));
        return boxes.slice(1).flatMap((box, index) => boxes[index].right > box.left ? [[boxes[index].label, box.label]] : []);
    });
    await page.screenshot({ path: test.info().outputPath("90-day-axis.png"), fullPage: true });
    expect(overlaps, `Overlapping neighboring labels: ${JSON.stringify(overlaps.slice(0, 5))}`).toHaveLength(0);
});
