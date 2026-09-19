import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 60000,
  use: { browserName: "chromium", viewport: { width: 1440, height: 1100 } },
  workers: 1,
  reporter: "list",
});
