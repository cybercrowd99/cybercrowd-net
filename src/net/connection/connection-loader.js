/**
 * NET Connection Loader
 *
 * CyberCrowd NET connection loader responsible for initializing declared
 * connection structures into the NET environment while preserving CORE
 * sovereignty boundaries.
 *
 * The connection loader introduces NET connection definitions into the
 * connection layer without creating authority over CORE structures.
 *
 * Connection loader responsibility:
 *
 * - Receive declared connection definitions
 * - Preserve connection identity
 * - Preserve connection type references
 * - Preserve destination references
 * - Preserve boundary references
 * - Preserve continuity references
 * - Register available connection structures
 * - Prepare connections for NET consumption
 *
 * The connection loader does not:
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
 * Connection definition precedes connection operation.
 */

export const NET_CONNECTION_LOADER_TYPE =
  "NET_CONNECTION_LOADER";

export const NET_CONNECTION_LOADER_VERSION =
  "1.0.0";

export const NET_CONNECTION_LOADER_STATES = Object.freeze([
  "DECLARED",
  "LOADED",
  "SEALED"
]);

export class NetConnectionLoader {
  constructor({
    registry = null
  } = {}) {
    this.type = NET_CONNECTION_LOADER_TYPE;
    this.version = NET_CONNECTION_LOADER_VERSION;

    this.registry = registry;

    this.connections = new Map();
  }

  load({
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
      state
    };

    connection.state = "LOADED";

    this.connections.set(id, connection);

    if (this.registry && this.registry.register) {
      this.registry.register(connection);
    }

    return connection;
  }

  get(id) {
    return this.connections.get(id) || null;
  }

  list() {
    return Array.from(this.connections.values());
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

export function createNetConnectionLoader(config) {
  return new NetConnectionLoader(config);
}
