import type { APIResponse } from '@playwright/test';
import type {
  ErrorResponse,
  LoginRequest,
  LoginResponse,
  UserProfile,
} from '@schemas/index';
import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc } from '@utils/decorators';
import { assertSchema } from '@utils/schemaValidator';

/**
 * Layer 3: Auth API Component
 *
 * Implements ATCs for JWT credential exchange, profile inspection,
 * and security boundary authorization checks.
 */
export class AuthApi extends ApiBase {
  @atc('AQE-103', { severity: 'blocker' })
  async loginSuccessfully(
    payload: LoginRequest,
  ): Promise<[APIResponse, LoginResponse, LoginRequest]> {
    const [response, body, sentPayload] = await this.apiPOST<
      LoginResponse,
      LoginRequest
    >('/auth/login', payload);

    expect(response.status()).toBe(200);
    assertSchema(body, 'LoginResponse');
    expect(body.accessToken).toBeDefined();

    this.setAuthToken(body.accessToken);
    return [response, body, sentPayload!];
  }

  @atc('AQE-104', { severity: 'normal' })
  async loginWithInvalidCredentials(
    payload: LoginRequest,
  ): Promise<[APIResponse, ErrorResponse]> {
    const [response, body] = await this.apiPOST<ErrorResponse, LoginRequest>(
      '/auth/login',
      payload,
    );

    expect(response.status()).toBe(401);
    assertSchema(body, 'ErrorResponse');
    expect(body.error.code).toBe('AUTH_INVALID_CREDENTIALS');

    return [response, body];
  }

  @atc('AQE-105', { severity: 'critical' })
  async getUserProfileSuccessfully(): Promise<[APIResponse, UserProfile]> {
    const [response, body] = await this.apiGET<UserProfile>('/auth/profile');

    expect(response.status()).toBe(200);
    assertSchema(body, 'UserProfile');
    expect(body.email).toBeDefined();

    return [response, body];
  }

  @atc('AQE-106', { severity: 'normal' })
  async getUserProfileUnauthorized(): Promise<[APIResponse, ErrorResponse]> {
    const originalToken = this.getAuthToken();
    this.clearAuthToken();

    try {
      const [response, body] = await this.apiGET<ErrorResponse>('/auth/profile');
      expect(response.status()).toBe(401);
      assertSchema(body, 'ErrorResponse');
      return [response, body];
    }
    finally {
      if (originalToken) {
        this.setAuthToken(originalToken);
      }
    }
  }
}
