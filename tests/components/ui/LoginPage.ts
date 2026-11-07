import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc } from '@utils/decorators';

export interface LoginCredentials {
  email?: string
  password?: string
}

/**
 * Layer 3: Login Page Object Component
 *
 * Encapsulates authentication interactions and atomic login ATCs.
 */
export class LoginPage extends UiBase {
  @atc('AQE-201', { severity: 'blocker' })
  async loginSuccessfully(credentials?: LoginCredentials): Promise<void> {
    const email = credentials?.email ?? this.config.userEmail;
    const password = credentials?.password ?? this.config.userPassword ?? 'SecurePassword123!';

    await this.goto('/login');

    await this.getByTestId('email-input').fill(email);
    await this.getByTestId('password-input').fill(password);
    await this.getByTestId('login-submit').click();

    await this.assertUrl(/.*dashboard/);
  }

  @atc('AQE-202', { severity: 'normal' })
  async loginWithInvalidCredentials(credentials?: LoginCredentials): Promise<void> {
    const email = credentials?.email ?? this.config.userEmail;
    const password = credentials?.password ?? 'wrong_password';

    await this.goto('/login');

    await this.getByTestId('email-input').fill(email);
    await this.getByTestId('password-input').fill(password);
    await this.getByTestId('login-submit').click();

    const errorBox = this.getByTestId('auth-error');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText(/Authentication failed|Invalid/);
  }
}
