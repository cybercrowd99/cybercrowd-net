// src/http/ephemeral-port-allocator-http.ts
// Commit: next after 98d9052
//
// HTTP Interface Organ
// - Wraps the allocator with deterministic request/response behavior.
// - No framework assumptions.
// - Pure functions ready to plug into Express/Hono/Workers/DO.

import {
  EphemeralPortAllocator,
  AllocationResult,
  HeartbeatResult,
  ReleaseResult,
  ActiveSummary,
  EphemeralPortAllocatorConfig
} from "../ephemeral-port-allocator";

export interface HttpRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body: any;
}

export interface HttpResponse {
  status: number;
  body: any;
}

export class EphemeralPortAllocatorHttp {
  private allocator: EphemeralPortAllocator;

  constructor(cfg: EphemeralPortAllocatorConfig) {
    this.allocator = new EphemeralPortAllocator(cfg);
  }

  /**
   * Main router
   */
  handle(req: HttpRequest): HttpResponse {
    const { method, path } = req;

    if (method === "POST" && path === "/allocate") {
      return this.allocate(req);
    }

    if (method === "POST" && path === "/heartbeat") {
      return this.heartbeat(req);
    }

    if (method === "POST" && path === "/release") {
      return this.release(req);
    }

    if (method === "GET" && path === "/ports/active") {
      return this.activeSummary();
    }

    if (method === "GET" && path.startsWith("/ports/tenant/")) {
      const tenant_id = path.split("/").pop()!;
      return this.tenantSummary(tenant_id);
    }

    return { status: 404, body: { error: "not-found" } };
  }

  /**
   * Allocate endpoint
   */
  private allocate(req: HttpRequest): HttpResponse {
    const tenant_id = req.body?.tenant_id;
    const result: AllocationResult = this.allocator.allocate(tenant_id);

    if (!result.ok) {
      return { status: 400, body: result };
    }

    return { status: 200, body: result };
  }

  /**
   * Heartbeat endpoint
   */
  private heartbeat(req: HttpRequest): HttpResponse {
    const tenant_id = req.body?.tenant_id;
    const lease_id = req.body?.lease_id;
    const port = Number(req.body?.port);

    const result: HeartbeatResult = this.allocator.heartbeat(
      tenant_id,
      lease_id,
      port
    );

    if (!result.ok) {
      return { status: 400, body: result };
    }

    return { status: 200, body: result };
  }

  /**
   * Release endpoint
   */
  private release(req: HttpRequest): HttpResponse {
    const tenant_id = req.body?.tenant_id;
    const lease_id = req.body?.lease_id;
    const port = Number(req.body?.port);

    const result: ReleaseResult = this.allocator.release(
      tenant_id,
      lease_id,
      port
    );

    if (!result.ok) {
      return { status: 400, body: result };
    }

    return { status: 200, body: result };
  }

  /**
   * Active summary endpoint
   */
  private activeSummary(): HttpResponse {
    const summary: ActiveSummary = this.allocator.getActiveSummary();
    return { status: 200, body: summary };
  }

  /**
   * Tenant summary endpoint
   */
  private tenantSummary(tenant_id: string): HttpResponse {
    const leases = this.allocator.getTenantLeases(tenant_id);
    return { status: 200, body: leases };
  }
}
