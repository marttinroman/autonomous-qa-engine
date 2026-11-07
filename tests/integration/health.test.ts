import { expect, test } from '@fixtures/TestFixture';

test.describe('Health API Contract & SLA Validation', () => {
  test('AQE-101: should return healthy status conforming to OpenAPI contract', async ({
    api,
  }) => {
    const [, body] = await api.health.getHealthStatusSuccessfully();

    expect(body.status).toBe('healthy');
    expect(body.database?.connected).toBe(true);
    expect(body.version).toBe('1.0.0');
  });

  test('AQE-102: should adhere to SLA response time budget (p95 < 500ms)', async ({
    api,
  }) => {
    await api.health.measureHealthLatencyBudget(5);
  });
});
