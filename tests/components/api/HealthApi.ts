import type { APIResponse } from '@playwright/test';
import type { HealthCheckResponse } from '@schemas/index';
import { ApiBase } from '@api/ApiBase';
import { expect } from '@playwright/test';
import { atc } from '@utils/decorators';
import { assertSla, computeLatencyMetrics } from '@utils/latencyGuard';
import { assertSchema } from '@utils/schemaValidator';

/**
 * Layer 3: Health API Component
 *
 * Implements ATCs for service health inspection, database readiness,
 * and SLA latency budgets.
 */
export class HealthApi extends ApiBase {
  @atc('AQE-101', { severity: 'critical' })
  async getHealthStatusSuccessfully(): Promise<[APIResponse, HealthCheckResponse]> {
    const [response, body] = await this.apiGET<HealthCheckResponse>('/health');

    expect(response.status()).toBe(200);
    assertSchema(body, 'HealthCheckResponse');
    expect(body.status).toBe('healthy');
    expect(body.database?.connected).toBe(true);

    return [response, body];
  }

  @atc('AQE-102', { severity: 'normal' })
  async measureHealthLatencyBudget(sampleCount = 5): Promise<void> {
    const samples: number[] = [];
    for (let i = 0; i < sampleCount; i++) {
      const [res] = await this.apiGET('/health');
      expect(res.status()).toBe(200);
      samples.push(this.getLastLatencyMs());
    }

    const metrics = computeLatencyMetrics(samples, { discardWarmupCount: 1 });
    assertSla(metrics, {
      p95MaxMs: this.config.slaP95Ms,
      p99MaxMs: this.config.slaP99Ms,
    });
  }
}
