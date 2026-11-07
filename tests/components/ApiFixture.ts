import type { TestContextOptions } from '@fixtures/TestContext';
import type { APIRequestContext } from '@playwright/test';
import { ApiBase } from '@api/ApiBase';
import { AuthApi } from '@api/AuthApi';
import { HealthApi } from '@api/HealthApi';

/**
 * Layer 4: API Fixture Container
 *
 * Dependency injection container encapsulating all API components.
 * Propagates auth tokens and request contexts to child components.
 */
export class ApiFixture extends ApiBase {
  readonly health: HealthApi;
  readonly auth: AuthApi;

  constructor(options?: TestContextOptions) {
    super(options);
    this.health = new HealthApi(options);
    this.auth = new AuthApi(options);
  }

  override setRequestContext(request: APIRequestContext): void {
    super.setRequestContext(request);
    this.health.setRequestContext(request);
    this.auth.setRequestContext(request);
  }

  override setAuthToken(token: string): void {
    super.setAuthToken(token);
    this.health.setAuthToken(token);
    this.auth.setAuthToken(token);
  }

  override clearAuthToken(): void {
    super.clearAuthToken();
    this.health.clearAuthToken();
    this.auth.clearAuthToken();
  }
}
