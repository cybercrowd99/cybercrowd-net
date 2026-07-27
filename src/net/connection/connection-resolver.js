/**
 * NET Connection Resolver
 *
 * CyberCrowd NET connection resolver responsible for resolving declared
 * connection relationships within the NET environment while preserving CORE
 * sovereignty separation and structural containment.
 *
 * The connection resolver connects declared NET connection references without
 * creating authority over CORE structures or modifying connected systems.
 *
 * Connection resolver responsibility:
 *
 * - Resolve declared source references
 * - Resolve declared destination references
 * - Preserve connection identity
 * - Preserve connection type references
 * - Preserve boundary references
 * - Preserve continuity references
 * - Preserve evidence relationships
 * - Provide structural connection awareness
 *
 * The connection resolver does not:
 *
 * - Create CORE sovereignty definitions
 * - Grant authority
 * - Modify CORE objects
 * - Execute operations
 * - Route requests
 * - Authenticate sessions
 * - Enforce policies
 * - Replace governance
 * - Bypass boundaries
 *
 * Connection definition precedes connection resolution.
 */

export const NET_CONNECTION_RESOLVER_TYPE =
  "NET_CONNECTION_RESOLVER";

export const NET_CONNECTION_RESOLVER_VERSION =
  "1.0.0";

export const NET_CONNECTION_RESOLVER_STATES = Object.freeze([
  "DECLARED",
  "RESOLVED",
  "UNRESOLVED",
  "SEALED"
]);

export class NetConnectionResolver {
  constructor({
    registry = null,
    guard = null
  } = {}) {
    this.type = NET_CONNECTION_RESOLVER_TYPE;
    this.version = NET_CONNECTION_RESOLVER_VERSION;

    this.registry = registry;
    this.guard = guard;

    this.resolutions = new Map();
  }

  resolve({
    id,
    sourceReference,
    targetReference,
    boundaryReference = null,
    continuityReference = null,
    evidenceReference = null,
    state = "DECLARED"
  }) {
    const resolution = {
      id,
      sourceReference,
      targetReference,
      boundaryReference,
      continuityReference,
      evidenceReference,
      state
    };

    // Guard alignment
    if (
      this.guard &&
      !this.guard.check({
        id: `${id}:guard`,
        connectionReference: sourceReference,
        boundaryReference,
        continuityReference
      })
    ) {
      resolution.state = "UNRESOLVED";
      this.resolutions.set(id, resolution);
      return false;
    }

    // Registry presence
    const source = this.registry
      ? this.registry.get(sourceReference)
      : null;

    const target = this.registry
      ? this.registry.get(targetReference)
      : null;

    if (!source || !target) {
      resolution.state = "UNRESOLVED";
      this.resolutions.set(id, resolution);
      return false;
    }

    resolution.state = "RESOLVED";
    this.resolutions.set(id, resolution);

    return true;
  }

  get(id) {
    return this.resolutions.get(id) || null;
  }

  list() {
    return Array.from(this.resolutions.values());
  }

  findBySource(sourceReference) {
    return this.list().filter(
      (r) => r.sourceReference === sourceReference
    );
  }

  findByTarget(targetReference) {
    return this.list().filter(
      (r) => r.targetReference === targetReference
    );
  }

  describe() {
    return {
      type: this.type,
      version: this.version,
      resolutionCount: this.resolutions.size
    };
  }

  clear() {
    this.resolutions.clear();
  }
}

export function createNetConnectionResolver(config) {
  return new NetConnectionResolver(config);
}
