import type { APIRequestContext, Page } from '@playwright/test';
import { test as base, expect } from '@playwright/test';
import { ApiFixture } from './ApiFixture';
import { UiFixture } from './UiFixture';

/**
 * Layer 4: Combined Test Fixture (Hybrid)
 *
 * Provides synchronized API and UI access sharing the same execution context.
 */
export class TestFixture {
  readonly api: ApiFixture;
  readonly ui: UiFixture;

  constructor(page?: Page, request?: APIRequestContext) {
    this.api = new ApiFixture({ request });
    this.ui = new UiFixture({ page, request });
  }
}

/**
 * Layer 4: Unified Playwright Test Fixture
 *
 * Implements Playwright fixture extension with lazy-loading:
 * - { api }: API-only fixture, uses Playwright APIRequestContext (zero browser overhead).
 * - { ui }: UI-only fixture, initializes Playwright browser Page and Page Objects.
 * - { test }: Hybrid fixture, synchronizes UI and API state within the same test context.
 */
export const test = base.extend<{
  test: TestFixture
  api: ApiFixture
  ui: UiFixture
}>({
  // Hybrid fixture: UI + API with shared context
  test: async ({ page, request }, use) => {
    const fixture = new TestFixture(page, request);
    await use(fixture);
  },

  // API-only fixture: NO browser opened (Playwright lazy loading)
  api: async ({ request }, use) => {
    const apiFixture = new ApiFixture({ request });
    await use(apiFixture);
  },

  // UI fixture: Has both page and request context
  ui: async ({ page, request }, use) => {
    const uiFixture = new UiFixture({ page, request });
    await use(uiFixture);
  },
});

export { expect };
