import { describe, expect, it } from 'bun:test';
import {
  assertSla,
  computeLatencyMetrics,
  evaluateSla,
  formatLatencyReport,
} from './latencyGuard';

describe('latencyGuard', () => {
  it('computes percentiles and averages accurately from sample array', () => {
    const samples = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const metrics = computeLatencyMetrics(samples);

    expect(metrics.count).toBe(10);
    expect(metrics.minMs).toBe(10);
    expect(metrics.maxMs).toBe(100);
    expect(metrics.avgMs).toBe(55);
    expect(metrics.p50Ms).toBe(55);
    expect(metrics.p95Ms).toBe(95.5);
  });

  it('discards initial warmup iterations if requested', () => {
    const samples = [500, 20, 25, 22, 24]; // 500 is a cold start
    const metrics = computeLatencyMetrics(samples, { discardWarmupCount: 1 });

    expect(metrics.count).toBe(4);
    expect(metrics.maxMs).toBe(25);
    expect(metrics.avgMs).toBe(22.75);
  });

  it('evaluates SLA compliance positively when within budget', () => {
    const samples = [12, 14, 15, 18, 20, 22, 25];
    const metrics = computeLatencyMetrics(samples);
    const result = evaluateSla(metrics, { p95MaxMs: 500, p99MaxMs: 1000 });

    expect(result.passed).toBe(true);
    expect(result.violations.length).toBe(0);
  });

  it('detects and reports SLA budget breach', () => {
    const samples = [100, 200, 600, 700, 850];
    const metrics = computeLatencyMetrics(samples);
    const result = evaluateSla(metrics, { p95MaxMs: 500, p99MaxMs: 800 });

    expect(result.passed).toBe(false);
    expect(result.violations.some(v => v.includes('p95 latency'))).toBe(true);
    expect(() => assertSla(metrics, { p95MaxMs: 500, p99MaxMs: 800 })).toThrow(
      '[SLA Performance Budget Breached]',
    );
  });

  it('formats clean ASCII report', () => {
    const samples = [15, 20, 25, 30];
    const metrics = computeLatencyMetrics(samples);
    const report = formatLatencyReport(metrics, 'GET /health');

    expect(report).toContain('LATENCY SLA PERFORMANCE REPORT');
    expect(report).toContain('GET /health');
  });
});
