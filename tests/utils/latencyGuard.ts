import { config } from '@variables';

export interface LatencyMetrics {
  count: number
  minMs: number
  maxMs: number
  avgMs: number
  p50Ms: number
  p90Ms: number
  p95Ms: number
  p99Ms: number
}

export interface SlaThresholds {
  p95MaxMs?: number
  p99MaxMs?: number
  maxMs?: number
}

export interface SlaCheckResult {
  passed: boolean
  metrics: LatencyMetrics
  thresholds: Required<SlaThresholds>
  violations: string[]
}

/**
 * Calculates a specific percentile from a sorted array of numbers (0 <= p <= 100).
 */
function calculatePercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) { return 0; }
  if (sorted.length === 1) { return sorted[0]; }

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return Number(sorted[lower].toFixed(2));
  }
  const interpolated = sorted[lower] * (1 - weight) + sorted[upper] * weight;
  return Number(interpolated.toFixed(2));
}

/**
 * Computes high-precision percentile latency metrics from an array of millisecond timings.
 *
 * @param samples Array of response times in milliseconds.
 * @param options Configuration options for warm-up discarding.
 * @param options.discardWarmupCount Number of initial samples to discard as cold-start warmup.
 */
export function computeLatencyMetrics(
  samples: number[],
  options?: { discardWarmupCount?: number },
): LatencyMetrics {
  if (samples.length === 0) {
    return {
      count: 0,
      minMs: 0,
      maxMs: 0,
      avgMs: 0,
      p50Ms: 0,
      p90Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
    };
  }

  const effective = options?.discardWarmupCount
    ? samples.slice(options.discardWarmupCount)
    : samples;

  const activeSamples = effective.length > 0 ? effective : samples;
  const sorted = [...activeSamples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);

  return {
    count: sorted.length,
    minMs: Number(sorted[0].toFixed(2)),
    maxMs: Number(sorted[sorted.length - 1].toFixed(2)),
    avgMs: Number((sum / sorted.length).toFixed(2)),
    p50Ms: calculatePercentile(sorted, 50),
    p90Ms: calculatePercentile(sorted, 90),
    p95Ms: calculatePercentile(sorted, 95),
    p99Ms: calculatePercentile(sorted, 99),
  };
}

/**
 * Validates latency metrics against SLA thresholds.
 */
export function evaluateSla(
  metrics: LatencyMetrics,
  thresholds?: SlaThresholds,
): SlaCheckResult {
  const p95Max = thresholds?.p95MaxMs ?? config.slaP95Ms;
  const p99Max = thresholds?.p99MaxMs ?? config.slaP99Ms;
  const maxMax = thresholds?.maxMs ?? p99Max * 1.5;

  const violations: string[] = [];

  if (metrics.p95Ms > p95Max) {
    violations.push(
      `p95 latency (${metrics.p95Ms}ms) breached SLA budget of ${p95Max}ms (+${(metrics.p95Ms - p95Max).toFixed(1)}ms)`,
    );
  }

  if (metrics.p99Ms > p99Max) {
    violations.push(
      `p99 latency (${metrics.p99Ms}ms) breached SLA budget of ${p99Max}ms (+${(metrics.p99Ms - p99Max).toFixed(1)}ms)`,
    );
  }

  if (metrics.maxMs > maxMax) {
    violations.push(
      `Max latency (${metrics.maxMs}ms) exceeded extreme ceiling of ${maxMax}ms`,
    );
  }

  return {
    passed: violations.length === 0,
    metrics,
    thresholds: {
      p95MaxMs: p95Max,
      p99MaxMs: p99Max,
      maxMs: maxMax,
    },
    violations,
  };
}

/**
 * Asserts that latency metrics meet SLA thresholds, throwing on failure.
 */
export function assertSla(metrics: LatencyMetrics, thresholds?: SlaThresholds): void {
  const check = evaluateSla(metrics, thresholds);
  if (!check.passed) {
    throw new Error(`[SLA Performance Budget Breached] ${check.violations.join('; ')}`);
  }
}

/**
 * Formats a clean ASCII table representing latency percentiles.
 */
export function formatLatencyReport(metrics: LatencyMetrics, label = 'Endpoint'): string {
  return [
    '┌────────────────────────────────────────────────────────┐',
    `│ LATENCY SLA PERFORMANCE REPORT: ${label.padEnd(23)} │`,
    '├─────────────────┬──────────────────────────────────────┤',
    `│ Sample Count    │ ${String(metrics.count).padEnd(36)} │`,
    `│ Min / Max       │ ${`${metrics.minMs}ms / ${metrics.maxMs}ms`.padEnd(36)} │`,
    `│ Average         │ ${`${metrics.avgMs}ms`.padEnd(36)} │`,
    `│ p50 (Median)    │ ${`${metrics.p50Ms}ms`.padEnd(36)} │`,
    `│ p90             │ ${`${metrics.p90Ms}ms`.padEnd(36)} │`,
    `│ p95 (SLA Target)│ ${`${metrics.p95Ms}ms`.padEnd(36)} │`,
    `│ p99 (Worst Case)│ ${`${metrics.p99Ms}ms`.padEnd(36)} │`,
    '└─────────────────┴──────────────────────────────────────┘',
  ].join('\n');
}
