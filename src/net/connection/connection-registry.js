/**
 * NET Connection Registry
 *
 * CyberCrowd NET connection registry responsible for maintaining declared
 * connection structures within the NET environment while preserving CORE
 * sovereignty separation.
 *
 * The connection registry maintains connection references without creating
 * authority over CORE structures or owning the connected systems.
 *
 * Connection registry responsibility:
 *
 * - Maintain declared connection references
 * - Preserve connection identity
 * - Preserve connection type references
 * - Preserve source references
 * - Preserve destination references
 * - Preserve boundary references
 * - Preserve continuity references
 * - Provide controlled connection lookup
 *
 * The connection registry does not:
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
 * Registry definition precedes registry operation.
 */

export const NET_CONNECTION_REGISTRY_TYPE =
  "NET_CONNECTION_REGISTRY";

export const NET_CONNECTION_REGISTRY_VERSION =
  "1.0.0";

export const NET_CONNECTION_REGISTRY_STATES = Object.freeze([
  "DECLARED",
  "REGISTERED",
  "SEALED"
]);

export class NetConnectionRegistry {
  constructor() {
    this.type = NET_CONNECTION_REGISTRY_TYPE;
    this.version = NET_CONNECTION_REGISTRY_VERSION;

    this.connections = new Map();
  }

  register({
    id,
    connectionType,
    sourceReference,
    targetReference,
    boundaryReference = null,
    continuityReference = null,
    state = "DECLARED"
  }) {
    const connection = {
      id,
      connectionType,
      sourceReference,
      targetReference,
      boundaryReference,
      continuityReference,
      state: "REGISTERED"
    };

    this.connections.set(id, connection);

    return connection;
  }

  get(id) {
    return this.connections.get(id) || null;
  }

  has(id) {
    return this.connections.has(id);
  }

  list() {
    return Array.from(this.connections.values());
  }

  findBySource(sourceReference) {
    return this.list().filter(
      (connection) =>
        connection.sourceReference === sourceReference
    );
  }

  findByTarget(targetReference) {
    return this.list().filter(
      (connection) =>
        connection.targetReference === targetReference
    );
  }

  describe() {
    return {
      type: this.type,
      version: this.version,
      connectionCount: this.connections.size
    };
  }

  clear() {
    this.connections.clear();
  }
}

export function createNetConnectionRegistry() {
  return new NetConnectionRegistry();
}
