/**
 * NET Connection Guard
 *
 * CyberCrowd NET connection guard responsible for preserving declared
 * connection boundaries during NET structural access while maintaining
 * separation from CORE sovereignty authority.
 *
 * The connection guard examines declared connection structures without
 * creating authority over connections or modifying connected systems.
 *
 * Connection guard responsibility:
 *
 * - Confirm declared connection boundaries
 * - Preserve connection identity awareness
 * - Preserve source references
 * - Preserve destination references
 * - Preserve boundary references
 * - Preserve continuity references
 * - Confirm containment alignment
 * - Report structural guard state
 *
 * The connection guard does not:
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
 * Boundary definition precedes boundary protection.
 */

export const NET_CONNECTION_GUARD_TYPE =
  "NET_CONNECTION_GUARD";

export const NET_CONNECTION_GUARD_VERSION =
  "1.0.0";

export const NET_CONNECTION_GUARD_STATES = Object.freeze([
  "DECLARED",
  "ALIGNED",
  "BLOCKED",
  "SEALED"
]);

export class NetConnectionGuard {
  constructor({
    index = null
  } = {}) {
    this.type = NET_CONNECTION_GUARD_TYPE;
    this.version = NET_CONNECTION_GUARD_VERSION;

    this.index = index;

    this.guards = new Map();
  }

  check({
    id,
    connectionReference,
    boundaryReference = null,
    continuityReference = null
  }) {
    const record = {
      id,
      connectionReference,
      boundaryReference,
      continuityReference,
      state: "DECLARED"
    };

    const connection = this.index
      ? this.index.get(connectionReference)
      : null;

    if (!connection) {
      record.state = "BLOCKED";

      this.guards.set(id, record);

      return false;
    }

    if (
      boundaryReference &&
      connection.boundaryReference !== boundaryReference
    ) {
      record.state = "BLOCKED";

      this.guards.set(id, record);

      return false;
    }

    if (
      continuityReference &&
      connection.continuityReference !== continuityReference
    ) {
      record.state = "BLOCKED";

      this.guards.set(id, record);

      return false;
    }

    record.state = "ALIGNED";

    this.guards.set(id, record);

    return true;
  }

  get(id) {
    return this.guards.get(id) || null;
  }

  list() {
    return Array.from(this.guards.values());
  }

  isAligned(id) {
    const record = this.get(id);

    return Boolean(
      record &&
      record.state === "ALIGNED"
    );
  }

  describe() {
    return {
      type: this.type,
      version: this.version,
      guardCount: this.guards.size
    };
  }

  clear() {
    this.guards.clear();
  }
}

export function createNetConnectionGuard(config) {
  return new NetConnectionGuard(config);
}
