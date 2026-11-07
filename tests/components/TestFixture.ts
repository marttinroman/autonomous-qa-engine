import { test as base, expect } from '@playwright/test';
import { ApiFixture } from './ApiFixture';

/**
 * Layer 4: Unified Playwright Test Fixture
 *
 * Implements Playwright fixture extension with lazy-loading:
 * - { api }: API-only fixture, uses Playwright APIRequestContext (zero browser overhead).
 */
export const test = base.extend<{
  api: ApiFixture
}>({
  api: async ({ request }, use) => {
    const apiFixture = new ApiFixture({ request });
    await use(apiFixture);
  },
});

export { expect };
