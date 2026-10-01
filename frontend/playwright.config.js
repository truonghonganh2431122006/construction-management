import { defineConfig } from "@playwright/test";
import process from "node:process";

export default defineConfig({
    testDir: "./tests",
    fullyParallel: false,
    workers: 1,
    timeout: 60000,
    use: {
        baseURL: "http://127.0.0.1:5175",
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
        headless: true,
        screenshot: "only-on-failure",
        trace: "retain-on-failure"
    },
    webServer: {
        command: "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort",
        url: "http://127.0.0.1:5175",
        reuseExistingServer: !process.env.CI
    }
});
