import { test } from '@fixtures/TestFixture';

test.describe('Layer 1: Quality Gate Dashboard & Navigation Flow', () => {
  test('AQE-203: should display active 3-layer Quality Gate status banner and metric cards', async ({
    ui,
  }) => {
    await ui.dashboard.verifyQualityGateStatus();
  });

  test('AQE-204: should navigate to AI evaluation console from dashboard', async ({
    ui,
  }) => {
    await ui.goto('/dashboard');
    await ui.dashboard.navigateToAiTesting();
  });

  test('AQE-205: should log out and redirect back to login page', async ({ ui }) => {
    await ui.goto('/dashboard');
    await ui.dashboard.logout();
  });
});
