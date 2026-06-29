// src/ephemeral-port-allocator-durable-object.ts
// allocator / durable-object-adapter
//
// Durable Object adapter for the Ephemeral Port Allocator.
//
// Purpose:
// - Own allocator state in one serialized object.
// - Prevent concurrent allocation collisions.
// - Persist cursor, leases, and metrics in Durable Object storage.
// - Expose allocator HTTP routes without HTML or framework dependency.
//
// Routes:
// POST /allocate
// POST /heartbeat
// POST /release
// POST /reclaim
// POST /sweep
// GET  /ports/active
// GET  /ports/tenant/:tenant_id
//
// Required Cloudflare binding example:
// [[durable_objects.bindings]]
// name = "EPHEMERAL_PORT_ALLOCATOR_DO"
// class_name = "EphemeralPortAllocatorDurableObject"

export type LeaseStatus = "active" | "reclaiming" | "expired";

export interface EphemeralPortAllocatorConfig {
  PORT_MIN: number;
  PORT_MAX: number;
  LEASE_TTL_MS: number;
  HEARTBEAT_GRACE_MS: number;
  MAX_RETRIES_PER_REQUEST: number;
}

export interface LeaseRecord {
  port: number;
  tenant_id: string;
  lease_id: string;
  created_at_ms: number;
  last_heartbeat_ms: number;
  status: LeaseStatus;
}

export interface AllocationResult {
  ok: boolean;
  port: number | null;
  lease_id: string | null;
  reason: string | null;
}

export interface HeartbeatResult {
  ok: boolean;
  reason: string | null;
}

export interface ReleaseResult {
  ok: boolean;
  reason: string | null;
}

export interface ReclaimResult {
  ok: boolean;
  scanned: number;
  reclaimed: number;
}

export interface AllocatorMetrics {
  port_allocations_total: number;
  port_allocations_failed_exhausted_total: number;
  port_reclaims_total: number;
  port_heartbeats_total: number;
  port_heartbeats_failed_total: number;
  port_releases_total: number;
}

export interface ActiveSummary {
  ok: boolean;
  total_capacity: number;
  active_count: number;
  expired_count: number;
  cursor_port: number;
  by_tenant: Array<{ tenant_id: string; active_count: number }>;
  metrics: AllocatorMetrics;
}

export interface TenantLeaseResult {
  ok: boolean;
  tenant_id: string;
  leases: LeaseRecord[];
  reason: string | null;
}

interface DurableObjectStorageLike {
  get<T = unknown>(key: string): Promise<T | undefined>;
  put<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  list<T = unknown>(options?: { prefix?: string }): Promise<Map<string, T>>;
}

interface DurableObjectStateLike {
  storage: DurableObjectStorageLike;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}

interface DurableObjectStubLike {
  fetch(request: Request): Promise<Response>;
}

interface DurableObjectNamespaceLike {
  idFromName(name: string): unknown;
  get(id: unknown): DurableObjectStubLike;
}

export interface EphemeralPortAllocatorDurableObjectEnv {
  EPHEMERAL_PORT_ALLOCATOR_DO?: DurableObjectNamespaceLike;

  PORT_MIN?: string | number;
  PORT_MAX?: string | number;
  LEASE_TTL_MS?: string | number;
  HEARTBEAT_GRACE_MS?: string | number;
  MAX_RETRIES_PER_REQUEST?: string | number;

  ALLOCATOR_OBJECT_NAME?: string;
}

const DEFAULT_CONFIG: EphemeralPortAllocatorConfig = {
  PORT_MIN: 49152,
  PORT_MAX: 65535,
  LEASE_TTL_MS: 30000,
  HEARTBEAT_GRACE_MS: 10000,
  MAX_RETRIES_PER_REQUEST: 8
};

const CURSOR_KEY = "cursor_port";

export default {
  async fetch(
    request: Request,
    env: EphemeralPortAllocatorDurableObjectEnv
  ): Promise<Response> {
    if (!env.EPHEMERAL_PORT_ALLOCATOR_DO) {
      return json(
        {
          ok: false,
          reason: "missing-durable-object-binding"
        },
        500
      );
    }

    const objectName =
      typeof env.ALLOCATOR_OBJECT_NAME === "string" &&
      env.ALLOCATOR_OBJECT_NAME.trim()
        ? env.ALLOCATOR_OBJECT_NAME.trim()
        : "global-ephemeral-port-allocator";

    const id = env.EPHEMERAL_PORT_ALLOCATOR_DO.idFromName(objectName);
    const stub = env.EPHEMERAL_PORT_ALLOCATOR_DO.get(id);

    return stub.fetch(request);
  }
};

export class EphemeralPortAllocatorDurableObject {
  private readonly state: DurableObjectStateLike;
  private readonly env: EphemeralPortAllocatorDurableObjectEnv;
  private readonly cfg: EphemeralPortAllocatorConfig;
  private readonly totalCapacity: number;

  constructor(
    state: DurableObjectStateLike,
    env: EphemeralPortAllocatorDurableObjectEnv
  ) {
    this.state = state;
    this.env = env;
    this.cfg = loadConfig(env);
    validateConfig(this.cfg);
    this.totalCapacity = this.cfg.PORT_MAX - this.cfg.PORT_MIN + 1;
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      const method = request.method.toUpperCase();

      if (method === "POST" && path === "/allocate") {
        const body = await readJson(request);
        return json(await this.allocate(stringValue(body.tenant_id)));
      }

      if (method === "POST" && path === "/heartbeat") {
        const body = await readJson(request);

        return json(
          await this.heartbeat(
            stringValue(body.tenant_id),
            stringValue(body.lease_id),
            numberValue(body.port)
          )
        );
      }

      if (method === "POST" && path === "/release") {
        const body = await readJson(request);

        return json(
          await this.release(
            stringValue(body.tenant_id),
            stringValue(body.lease_id),
            numberValue(body.port)
          )
        );
      }

      if (
        method === "POST" &&
        (path === "/reclaim" || path === "/sweep")
      ) {
        return json(await this.reclaimExpired());
      }

      if (method === "GET" && path === "/ports/active") {
        return json(await this.getActiveSummary());
      }

      if (method === "GET" && path.startsWith("/ports/tenant/")) {
        const tenant_id = decodeURIComponent(
          path.slice("/ports/tenant/".length)
        );

        return json(await this.getTenantLeases(tenant_id));
      }

      return json(
        {
          ok: false,
          reason: "not-found"
        },
        404
      );
    } catch (error) {
      return json(
        {
          ok: false,
          reason: "internal-error",
          error: error instanceof Error ? error.message : String(error)
        },
        500
      );
    }
  }

  async allocate(tenant_id: string | null): Promise<AllocationResult> {
    const tenant = cleanTenantId(tenant_id);

    if (!tenant) {
      return {
        ok: false,
        port: null,
        lease_id: null,
        reason: "invalid-tenant"
      };
    }

    return this.state.blockConcurrencyWhile(async () => {
      const now = Date.now();
      const maxIterations = Math.min(
        this.cfg.MAX_RETRIES_PER_REQUEST,
        this.totalCapacity
      );

      let cursor = await this.getCursorPort();

      for (let i = 0; i < maxIterations; i++) {
        const candidate = this.wrapPort(cursor + i);
        const key = leaseKey(candidate);
        const existing = await this.state.storage.get<LeaseRecord>(key);

        if (!existing) {
          return this.claimPort(candidate, tenant, now);
        }

        if (this.isLeaseExpired(existing, now)) {
          const reclaimed = await this.reclaimLeaseIfCurrent(existing, now);

          if (reclaimed) {
            return this.claimPort(candidate, tenant, now);
          }
        }
      }

      await this.incrementMetric("port_allocations_failed_exhausted_total");

      return {
        ok: false,
        port: null,
        lease_id: null,
        reason: "exhausted"
      };
    });
  }

  async heartbeat(
    tenant_id: string | null,
    lease_id: string | null,
    port: number | null
  ): Promise<HeartbeatResult> {
    const tenant = cleanTenantId(tenant_id);

    if (!tenant || !lease_id || !this.isValidPort(port)) {
      await this.incrementMetric("port_heartbeats_failed_total");

      return {
        ok: false,
        reason: "invalid-request"
      };
    }

    return this.state.blockConcurrencyWhile(async () => {
      const key = leaseKey(port);
      const lease = await this.state.storage.get<LeaseRecord>(key);

      if (!lease) {
        await this.incrementMetric("port_heartbeats_failed_total");

        return {
          ok: false,
          reason: "not-found"
        };
      }

      if (lease.lease_id !== lease_id) {
        await this.incrementMetric("port_heartbeats_failed_total");

        return {
          ok: false,
          reason: "not-found"
        };
      }

      if (lease.tenant_id !== tenant) {
        await this.incrementMetric("port_heartbeats_failed_total");

        return {
          ok: false,
          reason: "tenant-mismatch"
        };
      }

      const now = Date.now();

      if (this.isLeaseExpired(lease, now)) {
        lease.status = "expired";
        await this.state.storage.put(key, lease);
        await this.incrementMetric("port_heartbeats_failed_total");

        return {
          ok: false,
          reason: "expired"
        };
      }

      lease.last_heartbeat_ms = now;
      lease.status = "active";

      await this.state.storage.put(key, lease);
      await this.incrementMetric("port_heartbeats_total");

      return {
        ok: true,
        reason: null
      };
    });
  }

  async release(
    tenant_id: string | null,
    lease_id: string | null,
    port: number | null
  ): Promise<ReleaseResult> {
    const tenant = cleanTenantId(tenant_id);

    if (!tenant || !lease_id || !this.isValidPort(port)) {
      return {
        ok: false,
        reason: "invalid-request"
      };
    }

    return this.state.blockConcurrencyWhile(async () => {
      const key = leaseKey(port);
      const lease = await this.state.storage.get<LeaseRecord>(key);

      if (!lease) {
        return {
          ok: false,
          reason: "not-found"
        };
      }

      if (lease.lease_id !== lease_id) {
        return {
          ok: false,
          reason: "not-found"
        };
      }

      if (lease.tenant_id !== tenant) {
        return {
          ok: false,
          reason: "tenant-mismatch"
        };
      }

      await this.state.storage.delete(key);
      await this.incrementMetric("port_releases_total");

      return {
        ok: true,
        reason: null
      };
    });
  }

  async reclaimExpired(): Promise<ReclaimResult> {
    return this.state.blockConcurrencyWhile(async () => {
      const now = Date.now();
      const leases = await this.state.storage.list<LeaseRecord>({
        prefix: "lease:"
      });

      let scanned = 0;
      let reclaimed = 0;

      for (const [, lease] of leases) {
        scanned++;

        if (this.isLeaseExpired(lease, now)) {
          const didReclaim = await this.reclaimLeaseIfCurrent(lease, now);

          if (didReclaim) {
            reclaimed++;
          }
        }
      }

      return {
        ok: true,
        scanned,
        reclaimed
      };
    });
  }

  async getActiveSummary(): Promise<ActiveSummary> {
    const now = Date.now();
    const leases = await this.state.storage.list<LeaseRecord>({
      prefix: "lease:"
    });

    let active_count = 0;
    let expired_count = 0;

    const byTenantMap = new Map<string, number>();

    for (const [, lease] of leases) {
      if (this.isLeaseExpired(lease, now) || lease.status === "expired") {
        expired_count++;
        continue;
      }

      active_count++;

      byTenantMap.set(
        lease.tenant_id,
        (byTenantMap.get(lease.tenant_id) ?? 0) + 1
      );
    }

    const by_tenant = Array.from(byTenantMap.entries())
      .map(([tenant_id, count]) => ({
        tenant_id,
        active_count: count
      }))
      .sort((a, b) => a.tenant_id.localeCompare(b.tenant_id));

    return {
      ok: true,
      total_capacity: this.totalCapacity,
      active_count,
      expired_count,
      cursor_port: await this.getCursorPort(),
      by_tenant,
      metrics: await this.getMetrics()
    };
  }

  async getTenantLeases(tenant_id: string | null): Promise<TenantLeaseResult> {
    const tenant = cleanTenantId(tenant_id);

    if (!tenant) {
      return {
        ok: false,
        tenant_id: "",
        leases: [],
        reason: "invalid-tenant"
      };
    }

    const now = Date.now();
    const leases = await this.state.storage.list<LeaseRecord>({
      prefix: "lease:"
    });

    const result: LeaseRecord[] = [];

    for (const [, lease] of leases) {
      if (lease.tenant_id !== tenant) continue;
      if (this.isLeaseExpired(lease, now)) continue;

      result.push(cloneLease(lease));
    }

    result.sort((a, b) => a.port - b.port);

    return {
      ok: true,
      tenant_id: tenant,
      leases: result,
      reason: null
    };
  }

  private async claimPort(
    port: number,
    tenant_id: string,
    now: number
  ): Promise<AllocationResult> {
    const key = leaseKey(port);
    const existing = await this.state.storage.get<LeaseRecord>(key);

    if (existing && !this.isLeaseExpired(existing, now)) {
      return {
        ok: false,
        port: null,
        lease_id: null,
        reason: "race-conflict"
      };
    }

    const lease_id = makeLeaseId();

    const lease: LeaseRecord = {
      port,
      tenant_id,
      lease_id,
      created_at_ms: now,
      last_heartbeat_ms: now,
      status: "active"
    };

    await this.state.storage.put(key, lease);
    await this.setCursorPort(this.wrapPort(port + 1));
    await this.incrementMetric("port_allocations_total");

    return {
      ok: true,
      port,
      lease_id,
      reason: null
    };
  }

  private async reclaimLeaseIfCurrent(
    lease: LeaseRecord,
    now: number
  ): Promise<boolean> {
    const key = leaseKey(lease.port);
    const current = await this.state.storage.get<LeaseRecord>(key);

    if (!current) {
      return true;
    }

    if (
      current.lease_id !== lease.lease_id ||
      current.last_heartbeat_ms !== lease.last_heartbeat_ms
    ) {
      return false;
    }

    if (!this.isLeaseExpired(current, now)) {
      return false;
    }

    current.status = "reclaiming";
    await this.state.storage.put(key, current);

    await this.state.storage.delete(key);
    await this.incrementMetric("port_reclaims_total");

    return true;
  }

  private isLeaseExpired(lease: LeaseRecord, now: number): boolean {
    return (
      now >
      lease.last_heartbeat_ms +
        this.cfg.LEASE_TTL_MS +
        this.cfg.HEARTBEAT_GRACE_MS
    );
  }

  private async getCursorPort(): Promise<number> {
    const cursor = await this.state.storage.get<number>(CURSOR_KEY);

    if (Number.isInteger(cursor) && this.isValidPort(cursor)) {
      return cursor;
    }

    await this.state.storage.put(CURSOR_KEY, this.cfg.PORT_MIN);
    return this.cfg.PORT_MIN;
  }

  private async setCursorPort(port: number): Promise<void> {
    await this.state.storage.put(CURSOR_KEY, this.wrapPort(port));
  }

  private wrapPort(port: number): number {
    const offset = (port - this.cfg.PORT_MIN) % this.totalCapacity;
    return this.cfg.PORT_MIN + ((offset + this.totalCapacity) % this.totalCapacity);
  }

  private isValidPort(port: number | null): port is number {
    return (
      typeof port === "number" &&
      Number.isInteger(port) &&
      port >= this.cfg.PORT_MIN &&
      port <= this.cfg.PORT_MAX
    );
  }

  private async incrementMetric(name: keyof AllocatorMetrics): Promise<void> {
    const key = metricKey(name);
    const current = (await this.state.storage.get<number>(key)) ?? 0;
    await this.state.storage.put(key, current + 1);
  }

  private async getMetrics(): Promise<AllocatorMetrics> {
    return {
      port_allocations_total:
        (await this.state.storage.get<number>(
          metricKey("port_allocations_total")
        )) ?? 0,
      port_allocations_failed_exhausted_total:
        (await this.state.storage.get<number>(
          metricKey("port_allocations_failed_exhausted_total")
        )) ?? 0,
      port_reclaims_total:
        (await this.state.storage.get<number>(metricKey("port_reclaims_total"))) ??
        0,
      port_heartbeats_total:
        (await this.state.storage.get<number>(
          metricKey("port_heartbeats_total")
        )) ?? 0,
      port_heartbeats_failed_total:
        (await this.state.storage.get<number>(
          metricKey("port_heartbeats_failed_total")
        )) ?? 0,
      port_releases_total:
        (await this.state.storage.get<number>(metricKey("port_releases_total"))) ??
        0
    };
  }
}

function loadConfig(
  env: EphemeralPortAllocatorDurableObjectEnv
): EphemeralPortAllocatorConfig {
  return {
    PORT_MIN: intValue(env.PORT_MIN, DEFAULT_CONFIG.PORT_MIN),
    PORT_MAX: intValue(env.PORT_MAX, DEFAULT_CONFIG.PORT_MAX),
    LEASE_TTL_MS: intValue(env.LEASE_TTL_MS, DEFAULT_CONFIG.LEASE_TTL_MS),
    HEARTBEAT_GRACE_MS: intValue(
      env.HEARTBEAT_GRACE_MS,
      DEFAULT_CONFIG.HEARTBEAT_GRACE_MS
    ),
    MAX_RETRIES_PER_REQUEST: intValue(
      env.MAX_RETRIES_PER_REQUEST,
      DEFAULT_CONFIG.MAX_RETRIES_PER_REQUEST
    )
  };
}

function validateConfig(cfg: EphemeralPortAllocatorConfig): void {
  if (!Number.isInteger(cfg.PORT_MIN)) {
    throw new Error("PORT_MIN_MUST_BE_INTEGER");
  }

  if (!Number.isInteger(cfg.PORT_MAX)) {
    throw new Error("PORT_MAX_MUST_BE_INTEGER");
  }

  if (cfg.PORT_MIN >= cfg.PORT_MAX) {
    throw new Error("PORT_MIN_MUST_BE_LESS_THAN_PORT_MAX");
  }

  if (!Number.isInteger(cfg.LEASE_TTL_MS) || cfg.LEASE_TTL_MS <= 0) {
    throw new Error("LEASE_TTL_MS_MUST_BE_POSITIVE_INTEGER");
  }

  if (!Number.isInteger(cfg.HEARTBEAT_GRACE_MS) || cfg.HEARTBEAT_GRACE_MS < 0) {
    throw new Error("HEARTBEAT_GRACE_MS_MUST_BE_NON_NEGATIVE_INTEGER");
  }

  if (
    !Number.isInteger(cfg.MAX_RETRIES_PER_REQUEST) ||
    cfg.MAX_RETRIES_PER_REQUEST <= 0
  ) {
    throw new Error("MAX_RETRIES_PER_REQUEST_MUST_BE_POSITIVE_INTEGER");
  }
}

function cleanTenantId(value: string | null): string | null {
  if (typeof value !== "string") return null;

  const tenant = value.trim();

  if (!tenant) return null;
  if (tenant.length > 128) return null;

  if (!/^[a-zA-Z0-9._:@/-]+$/.test(tenant)) {
    return null;
  }

  return tenant;
}

function makeLeaseId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return (
    "lease-" +
    Math.random().toString(16).slice(2) +
    "-" +
    Date.now().toString(16)
  );
}

function leaseKey(port: number): string {
  return `lease:${port}`;
}

function metricKey(name: keyof AllocatorMetrics): string {
  return `metric:${name}`;
}

function cloneLease(lease: LeaseRecord): LeaseRecord {
  return {
    port: lease.port,
    tenant_id: lease.tenant_id,
    lease_id: lease.lease_id,
    created_at_ms: lease.created_at_ms,
    last_heartbeat_ms: lease.last_heartbeat_ms,
    status: lease.status
  };
}

function intValue(value: string | number | undefined, fallback: number): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();

    if (body && typeof body === "object" && !Array.isArray(body)) {
      return body as Record<string, unknown>;
    }

    return {};
  } catch {
    return {};
  }
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
 
