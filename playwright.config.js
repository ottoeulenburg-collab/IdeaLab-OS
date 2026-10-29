import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:5187", channel: "chrome" },
  webServer: {
    command: "npm run dev -- --port 5187 --strictPort",
    url: "http://127.0.0.1:5187",
    reuseExistingServer: false,
  },
});
