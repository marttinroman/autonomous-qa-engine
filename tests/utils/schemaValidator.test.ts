import { describe, expect, it } from 'bun:test';
import { assertSchema, validateSchema } from './schemaValidator';

describe('schemaValidator', () => {
  it('validates valid payload against HealthCheckResponse OpenAPI schema', () => {
    const validData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: 3600,
      latencyMs: 12.4,
      database: {
        connected: true,
        responseTimeMs: 3.2,
      },
      version: '1.0.0',
    };

    // Warmup compiles and caches schema
    validateSchema(validData, 'HealthCheckResponse');

    // Cached validation benchmark
    const result = validateSchema(validData, 'HealthCheckResponse');
    expect(result.valid).toBe(true);
    expect(result.durationMs).toBeLessThan(5);
  });

  it('detects schema violation when required field is missing', () => {
    const invalidData = {
      timestamp: new Date().toISOString(),
      uptimeSeconds: 3600,
    };

    const result = validateSchema(invalidData, 'HealthCheckResponse');
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('assertSchema throws error with descriptive message on contract drift', () => {
    const driftedData = {
      status: 'unsupported_status_value',
      version: '1.0.0',
    };

    expect(() => {
      assertSchema(driftedData, 'HealthCheckResponse');
    }).toThrow('[Contract Drift Detected]');
  });
});
