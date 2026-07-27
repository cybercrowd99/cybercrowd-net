/**
 * NET Connection Router
 *
 * CyberCrowd NET connection router responsible for controlled movement of
 * validated connection structures within the NET environment while preserving
 * CORE sovereignty separation and structural containment.
 *
 * The connection router directs declared and validated connection references
 * without creating authority over CORE structures or executing operations.
 *
 * Connection router responsibility:
 *
 * - Receive validated connection references
 * - Confirm routing readiness
 * - Preserve connection identity
 * - Preserve source references
 * - Preserve destination references
 * - Preserve boundary references
 * - Preserve continuity references
 * - Preserve evidence relationships
 * - Produce routing state
 *
 * The connection router does not:
 *
 * - Create CORE sovereignty definitions
 * - Grant authority
 * - Modify CORE objects
 * - Execute operations
 * - Authenticate sessions
 * - Enforce policies
 * - Replace governance
 * - Bypass boundaries
 *
 * Connection routing precedes connection session creation.
 */

export const NET_CONNECTION_ROUTER_TYPE =
  "NET_CONNECTION_ROUTER";

export const NET_CONNECTION_ROUTER_VERSION =
  "1.0.0";

export const NET_CONNECTION_ROUTING_STATES = Object.freeze([
  "DECLARED",
  "READY",
  "ROUTED",
  "BLOCKED",
  "SEALED"
]);

export class NetConnectionRouter {
  constructor({
    validator = null,
    index = null
  } = {}) {
    this.type = NET_CONNECTION_ROUTER_TYPE;
    this.version = NET_CONNECTION_ROUTER_VERSION;

    this.validator = validator;
    this.index = index;

    this.routes = new Map();
  }

  route({
    id,
    connectionReference,
    destinationReference,
    boundaryReference = null,
    continuityReference = null,
    evidenceReference = null
  }) {
    const route = {
      id,
      connectionReference,
      destinationReference,
      boundaryReference,
      continuityReference,
      evidenceReference,
      state: "DECLARED"
    };

    const connection = this.index
      ? this.index.get(connectionReference)
      : null;

    if (!connection) {
      route.state = "BLOCKED";
      this.routes.set(id, route);
      return false;
    }

    if (
      this.validator &&
      !this.validator.isValid(connectionReference)
    ) {
      route.state = "BLOCKED";
      this.routes.set(id, route);
      return false;
    }

    route.state = "ROUTED";

    this.routes.set(id, route);

    return true;
  }

  get(id) {
    return this.routes.get(id) || null;
  }

  list() {
    return Array.from(this.routes.values());
  }

  isRouted(id) {
    const route = this.get(id);

    return Boolean(
      route &&
      route.state === "ROUTED"
    );
  }

  describe() {
    return {
      type: this.type,
      version: this.version,
      routeCount: this.routes.size
    };
  }

  clear() {
    this.routes.clear();
  }
}

export function createNetConnectionRouter(config) {
  return new NetConnectionRouter(config);
}
