import { expect, test } from '@fixtures/TestFixture';

test.describe('Layer 1: Authentication Web UI & Session Flow', () => {
  test('AQE-201: should authenticate user with valid credentials and redirect to dashboard', async ({
    ui,
  }) => {
    await ui.login.loginSuccessfully({
      email: 'alex.sdet@example.com',
      password: 'SecurePassword123!',
    });

    const banner = ui.getByTestId('quality-gate-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('ALL 3 LAYERS PASSING');
  });

  test('AQE-202: should display error message when login fails with invalid credentials', async ({
    ui,
  }) => {
    await ui.login.loginWithInvalidCredentials({
      email: 'alex.sdet@example.com',
      password: 'wrong_password_xyz',
    });

    const errorBox = ui.getByTestId('auth-error');
    await expect(errorBox).toBeVisible();
  });
});
