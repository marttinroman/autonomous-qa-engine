import { expect } from '@playwright/test';
import { UiBase } from '@ui/UiBase';
import { atc } from '@utils/decorators';

/**
 * Layer 3: Dashboard Page Object Component
 *
 * Encapsulates Quality Gate dashboard inspection and navigation ATCs.
 */
export class DashboardPage extends UiBase {
  @atc('AQE-203', { severity: 'critical' })
  async verifyQualityGateStatus(): Promise<void> {
    await this.goto('/dashboard');

    const banner = this.getByTestId('quality-gate-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('ALL 3 LAYERS PASSING');

    const layer1 = this.getByTestId('layer1-status');
    const layer2 = this.getByTestId('layer2-status');
    const layer3 = this.getByTestId('layer3-status');

    await expect(layer1).toBeVisible();
    await expect(layer2).toBeVisible();
    await expect(layer3).toBeVisible();

    await expect(this.getByTestId('user-profile-badge')).toBeVisible();
  }

  @atc('AQE-204', { severity: 'normal' })
  async navigateToAiTesting(): Promise<void> {
    await this.getByTestId('nav-ai-testing').click();
    await this.assertUrl(/.*ai-testing/);
  }

  @atc('AQE-205', { severity: 'normal' })
  async logout(): Promise<void> {
    await this.getByTestId('logout-button').click();
    await this.assertUrl(/.*login/);
  }
}
