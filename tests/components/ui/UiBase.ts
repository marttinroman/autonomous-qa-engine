import type { TestContextOptions } from '@fixtures/TestContext';
import type { Locator, Page } from '@playwright/test';
import { TestContext } from '@fixtures/TestContext';
import { expect } from '@playwright/test';

/**
 * Layer 2: UI Base Component (KATA Architecture)
 *
 * Encapsulates Playwright Page primitives, auto-waiting smart locators,
 * URL resolution, and cross-browser interaction helpers.
 * Prohibits hardcoded static sleeps (`waitForTimeout`).
 */
export class UiBase extends TestContext {
  constructor(options?: TestContextOptions) {
    super(options);
  }

  /**
   * Returns the underlying Playwright Page instance, asserting it is initialized.
   */
  protected get requirePage(): Page {
    if (!this.page) {
      throw new Error(
        '[UiBase] Playwright Page is not initialized. Ensure this test is executed with the { ui } or { test } fixture.',
      );
    }
    return this.page;
  }

  /**
   * Resolves a relative path to the active Web URL.
   */
  protected buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const base = this.config.webUrl.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
  }

  /**
   * Navigates to a relative route with automatic networkidle/domcontentloaded waiting.
   */
  async goto(path: string): Promise<void> {
    const targetUrl = this.buildUrl(path);
    await this.requirePage.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Asserts the current URL matches an expected pattern or string.
   */
  async assertUrl(pattern: string | RegExp): Promise<void> {
    await expect(this.requirePage).toHaveURL(pattern);
  }

  /**
   * Smart auto-waiting locators.
   */
  locator(selector: string): Locator {
    return this.requirePage.locator(selector);
  }

  getByTestId(testId: string): Locator {
    return this.requirePage.getByTestId(testId);
  }

  getByRole(
    role: Parameters<Page['getByRole']>[0],
    options?: Parameters<Page['getByRole']>[1],
  ): Locator {
    return this.requirePage.getByRole(role, options);
  }

  getByText(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.requirePage.getByText(text, options);
  }

  getByPlaceholder(text: string | RegExp, options?: { exact?: boolean }): Locator {
    return this.requirePage.getByPlaceholder(text, options);
  }

  /**
   * Takes a diagnostic screenshot and attaches it to the current test step.
   */
  async captureScreenshot(name: string): Promise<Buffer> {
    return this.requirePage.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }
}
