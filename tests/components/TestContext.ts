import type { APIRequestContext, Page } from '@playwright/test';
import type { Environment, EnvironmentConfig } from '@variables';
import { faker } from '@faker-js/faker';
import { config } from '@variables';

export interface TestContextOptions {
  page?: Page
  request?: APIRequestContext
  environment?: Environment
}

/**
 * Layer 1: Test Context Layer
 *
 * Centralizes environment configuration, test data generation (Faker),
 * and shared Playwright Page/APIRequestContext references.
 */
export class TestContext {
  protected page?: Page;
  protected request?: APIRequestContext;
  readonly config: EnvironmentConfig;
  readonly faker = faker;

  constructor(options?: TestContextOptions) {
    this.page = options?.page;
    this.request = options?.request;
    this.config = config;
  }

  setRequestContext(request: APIRequestContext): void {
    this.request = request;
  }

  setPage(page: Page): void {
    this.page = page;
  }

  getPage(): Page | undefined {
    return this.page;
  }

  getRequestContext(): APIRequestContext | undefined {
    return this.request;
  }
}
