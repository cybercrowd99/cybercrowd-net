/**
 * NET Connection Index
 *
 * CyberCrowd NET connection index responsible for providing the unified access
 * surface for declared connection structures operating within the NET
 * environment.
 *
 * The connection index exposes connection references without creating
 * authority over CORE structures or owning connected systems.
 *
 * Connection index responsibility:
 *
 * - Provide controlled connection lookup
 * - Expose registered connection references
 * - Preserve connection identity
 * - Preserve connection type references
 * - Preserve source references
 * - Preserve destination references
 * - Preserve boundary references
 * - Preserve continuity references
 * - Maintain NET connection visibility
 *
 * The connection index does not:
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
 * Index definition precedes index operation.
 */

export const NET_CONNECTION_INDEX_TYPE =
  "NET_CONNECTION_INDEX";

export const NET_CONNECTION_INDEX_VERSION =
  "1.0.0";

export class NetConnectionIndex {
  constructor({
    registry = null
  } = {}) {
    this.type = NET_CONNECTION_INDEX_TYPE;
    this.version = NET_CONNECTION_INDEX_VERSION;

    this.registry = registry;
  }

  get(id) {
    if (!this.registry) {
      return null;
    }

    return this.registry.get(id);
  }

  has(id) {
    if (!this.registry) {
      return false;
    }

    return this.registry.has(id);
  }

  list() {
    if (!this.registry) {
      return [];
    }

    return this.registry.list();
  }

  findBySource(sourceReference) {
    if (!this.registry) {
      return [];
    }

    return this.registry.findBySource(
      sourceReference
    );
  }

  findByTarget(targetReference) {
    if (!this.registry) {
      return [];
    }

    return this.registry.findByTarget(
      targetReference
    );
  }

  describe() {
    return {
      type: this.type,
      version: this.version
    };
  }
}

export function createNetConnectionIndex(config) {
  return new NetConnectionIndex(config);
}
