import { defineConfig, devices } from '@playwright/test';
import { config } from './config/variables';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/*.test.ts'],
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
  ],
  use: {
    baseURL: config.webUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/integration',
      use: {
        baseURL: config.apiUrl,
      },
    },
    {
      name: 'chromium',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: config.webUrl,
      },
    },
    {
      name: 'firefox',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Firefox'],
        baseURL: config.webUrl,
      },
    },
    {
      name: 'webkit',
      testDir: './tests/e2e',
      use: {
        ...devices['Desktop Safari'],
        baseURL: config.webUrl,
      },
    },
  ],
  webServer:
    config.envName === 'local'
      ? {
          command: 'bun tests/server/mockServer.ts',
          url: 'http://localhost:3000/api/v1/health',
          reuseExistingServer: !process.env.CI,
          timeout: 10000,
        }
      : undefined,
});
