import { defineConfig } from '@playwright/test';
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
    baseURL: config.apiUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'api',
      testDir: './tests/integration',
      use: {
        baseURL: config.apiUrl,
      },
    },
  ],
  webServer: config.envName === 'local'
    ? {
        command: 'bun tests/server/mockServer.ts',
        url: 'http://localhost:3000/api/v1/health',
        reuseExistingServer: !process.env.CI,
        timeout: 10000,
      }
    : undefined,
});
