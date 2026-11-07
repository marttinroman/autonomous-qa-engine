import { expect, test } from '@fixtures/TestFixture';

test.describe('Auth API Contract & Security Boundary Validation', () => {
  test('AQE-103: should authenticate with valid credentials and return JWT', async ({
    api,
  }) => {
    const [, body] = await api.auth.loginSuccessfully({
      email: 'alex.sdet@example.com',
      password: 'SecurePassword123!',
    });

    expect(body.accessToken).toBeDefined();
    expect(body.tokenType).toBe('Bearer');
    expect(body.user?.email).toBe('alex.sdet@example.com');
  });

  test('AQE-104: should reject invalid credentials with 401 and ErrorResponse', async ({
    api,
  }) => {
    const [, body] = await api.auth.loginWithInvalidCredentials({
      email: 'alex.sdet@example.com',
      password: 'wrong',
    });

    expect(body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  });

  test('AQE-105: should fetch user profile with authenticated session', async ({
    api,
  }) => {
    await api.auth.loginSuccessfully({
      email: 'alex.sdet@example.com',
      password: 'SecurePassword123!',
    });

    const [, body] = await api.auth.getUserProfileSuccessfully();
    expect(body.email).toBe('alex.sdet@example.com');
    expect(body.role).toBe('sdet');
    expect(body.organization).toBe('Autonomous QA Org');
  });

  test('AQE-106: should reject profile request without authorization token', async ({
    api,
  }) => {
    const [, body] = await api.auth.getUserProfileUnauthorized();
    expect(body.error.code).toBe('AUTH_UNAUTHORIZED');
  });
});
