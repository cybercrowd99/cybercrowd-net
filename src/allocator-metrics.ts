// src/allocator-metrics.ts
// allocator / metrics
//
// Shared metrics model for the Ephemeral Port Allocator.
//
// Purpose:
// - Keep allocator counters in one reusable place.
// - Work with in-memory model, HTTP organ, Durable Object adapter, or later DB store.
// - No HTML. No framework. No runtime lock-in.

export type AllocatorMetricName =
  | "port_allocations_total"
  | "port_allocations_failed_exhausted_total"
  | "port_reclaims_total"
  | "port_heartbeats_total"
  | "port_heartbeats_failed_total"
  | "port_releases_total"
  | "port_release_failed_total"
  | "port_invalid_requests_total"
  | "port_tenant_mismatch_total"
  | "port_not_found_total";

export interface AllocatorMetricsSnapshot {
  port_allocations_total: number;
  port_allocations_failed_exhausted_total: number;
  port_reclaims_total: number;
  port_heartbeats_total: number;
  port_heartbeats_failed_total: number;
  port_releases_total: number;
  port_release_failed_total: number;
  port_invalid_requests_total: number;
  port_tenant_mismatch_total: number;
  port_not_found_total: number;
}

export interface AllocatorMetricEvent {
  name: AllocatorMetricName;
  amount: number;
  at_ms: number;
}

export const ALLOCATOR_METRIC_NAMES: AllocatorMetricName[] = [
  "port_allocations_total",
  "port_allocations_failed_exhausted_total",
  "port_reclaims_total",
  "port_heartbeats_total",
  "port_heartbeats_failed_total",
  "port_releases_total",
  "port_release_failed_total",
  "port_invalid_requests_total",
  "port_tenant_mismatch_total",
  "port_not_found_total"
];

export function createEmptyAllocatorMetrics(): AllocatorMetricsSnapshot {
  return {
    port_allocations_total: 0,
    port_allocations_failed_exhausted_total: 0,
    port_reclaims_total: 0,
    port_heartbeats_total: 0,
    port_heartbeats_failed_total: 0,
    port_releases_total: 0,
    port_release_failed_total: 0,
    port_invalid_requests_total: 0,
    port_tenant_mismatch_total: 0,
    port_not_found_total: 0
  };
}

export class AllocatorMetrics {
  private readonly counters: AllocatorMetricsSnapshot;
  private readonly events: AllocatorMetricEvent[] = [];
  private readonly maxEvents: number;
  private readonly nowMs: () => number;

  constructor(options: { max_events?: number; now_ms?: () => number } = {}) {
    this.counters = createEmptyAllocatorMetrics();
    this.maxEvents = options.max_events ?? 250;
    this.nowMs = options.now_ms ?? (() => Date.now());
  }

  increment(name: AllocatorMetricName): void {
    this.add(name, 1);
  }

  add(name: AllocatorMetricName, amount: number): void {
    if (!this.isMetricName(name)) {
      throw new Error("INVALID_ALLOCATOR_METRIC_NAME");
    }

    if (!Number.isFinite(amount)) {
      throw new Error("ALLOCATOR_METRIC_AMOUNT_MUST_BE_FINITE");
    }

    if (amount < 0) {
      throw new Error("ALLOCATOR_METRIC_AMOUNT_MUST_NOT_BE_NEGATIVE");
    }

    this.counters[name] += amount;

    this.recordEvent({
      name,
      amount,
      at_ms: this.nowMs()
    });
  }

  snapshot(): AllocatorMetricsSnapshot {
    return { ...this.counters };
  }

  recentEvents(): AllocatorMetricEvent[] {
    return this.events.map((event) => ({ ...event }));
  }

  reset(): void {
    for (const name of ALLOCATOR_METRIC_NAMES) {
      this.counters[name] = 0;
    }

    this.events.length = 0;
  }

  load(snapshot: Partial<AllocatorMetricsSnapshot>): void {
    for (const name of ALLOCATOR_METRIC_NAMES) {
      const value = snapshot[name];

      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        this.counters[name] = value;
      }
    }
  }

  merge(snapshot: Partial<AllocatorMetricsSnapshot>): void {
    for (const name of ALLOCATOR_METRIC_NAMES) {
      const value = snapshot[name];

      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        this.counters[name] += value;
      }
    }
  }

  toJSON(): AllocatorMetricsSnapshot {
    return this.snapshot();
  }

  private recordEvent(event: AllocatorMetricEvent): void {
    if (this.maxEvents <= 0) return;

    this.events.push(event);

    while (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  private isMetricName(value: string): value is AllocatorMetricName {
    return (ALLOCATOR_METRIC_NAMES as string[]).includes(value);
  }
}

export function metricKey(name: AllocatorMetricName): string {
  return `metric:${name}`;
}

export function normalizeAllocatorMetrics(
  input: Partial<AllocatorMetricsSnapshot> | null | undefined
): AllocatorMetricsSnapshot {
  const output = createEmptyAllocatorMetrics();

  if (!input) {
    return output;
  }

  for (const name of ALLOCATOR_METRIC_NAMES) {
    const value = input[name];

    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      output[name] = value;
    }
  }

  return output;
}
