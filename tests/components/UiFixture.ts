import type { TestContextOptions } from '@fixtures/TestContext';
import type { Page } from '@playwright/test';
import { AIChatPage } from '@ui/AIChatPage';
import { DashboardPage } from '@ui/DashboardPage';
import { LoginPage } from '@ui/LoginPage';
import { UiBase } from '@ui/UiBase';

/**
 * Layer 4: UI Fixture Container
 *
 * Dependency injection container encapsulating all Page Objects.
 * Binds Playwright Page instance across all UI components.
 */
export class UiFixture extends UiBase {
  readonly login: LoginPage;
  readonly dashboard: DashboardPage;
  readonly aiChat: AIChatPage;

  constructor(options?: TestContextOptions) {
    super(options);
    this.login = new LoginPage(options);
    this.dashboard = new DashboardPage(options);
    this.aiChat = new AIChatPage(options);
  }

  override setPage(page: Page): void {
    super.setPage(page);
    this.login.setPage(page);
    this.dashboard.setPage(page);
    this.aiChat.setPage(page);
  }
}
