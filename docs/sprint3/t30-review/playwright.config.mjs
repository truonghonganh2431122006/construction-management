import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const requireFrontend = createRequire(new URL("../../../frontend/package.json", import.meta.url));
const { defineConfig } = requireFrontend("@playwright/test");

export default defineConfig({
    testDir: ".",
    testMatch: "browser.spec.mjs",
    outputDir: "./browser-results",
    reporter: [["line"], ["json", { outputFile: fileURLToPath(new URL("./browser-results.json", import.meta.url)) }]],
    workers: 1,
    timeout: 30000,
    use: {
        baseURL: "http://127.0.0.1:5176",
        headless: true,
        screenshot: "only-on-failure",
        trace: "retain-on-failure"
    },
    webServer: {
        command: "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5176 --strictPort",
        cwd: fileURLToPath(new URL("../../../frontend", import.meta.url)),
        url: "http://127.0.0.1:5176",
        reuseExistingServer: false
    }
});
