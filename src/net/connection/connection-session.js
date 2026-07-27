/**
 * NET Connection Session
 *
 * CyberCrowd NET connection session responsible for maintaining declared
 * session context after validated connection routing while preserving CORE
 * sovereignty separation and structural containment.
 *
 * The connection session represents connection continuity during NET activity
 * without creating authority over CORE structures or executing operations.
 *
 * Connection session responsibility:
 *
 * - Create declared session context
 * - Preserve connection identity
 * - Preserve routed connection references
 * - Preserve source references
 * - Preserve destination references
 * - Preserve boundary references
 * - Preserve continuity references
 * - Preserve evidence relationships
 * - Maintain session state
 *
 * The connection session does not:
 *
 * - Create CORE sovereignty definitions
 * - Grant authority
 * - Modify CORE objects
 * - Execute operations
 * - Authenticate identity
 * - Enforce policies
 * - Replace governance
 * - Bypass boundaries
 *
 * Connection session definition precedes connection session operation.
 */

export const NET_CONNECTION_SESSION_TYPE =
  "NET_CONNECTION_SESSION";

export const NET_CONNECTION_SESSION_VERSION =
  "1.0.0";

export const NET_CONNECTION_SESSION_STATES = Object.freeze([
  "DECLARED",
  "ACTIVE",
  "SEALED",
  "ENDED"
]);

export class NetConnectionSession {
  constructor({
    router = null
  } = {}) {
    this.type = NET_CONNECTION_SESSION_TYPE;
    this.version = NET_CONNECTION_SESSION_VERSION;

    this.router = router;

    this.sessions = new Map();
  }

  create({
    id,
    routeReference,
    connectionReference,
    sourceReference,
    destinationReference,
    boundaryReference = null,
    continuityReference = null,
    evidenceReference = null
  }) {
    const session = {
      id,
      routeReference,
      connectionReference,
      sourceReference,
      destinationReference,
      boundaryReference,
      continuityReference,
      evidenceReference,
      state: "DECLARED"
    };

    if (
      this.router &&
      !this.router.isRouted(routeReference)
    ) {
      session.state = "ENDED";

      this.sessions.set(id, session);

      return false;
    }

    session.state = "ACTIVE";

    this.sessions.set(id, session);

    return true;
  }

  get(id) {
    return this.sessions.get(id) || null;
  }

  list() {
    return Array.from(this.sessions.values());
  }

  isActive(id) {
    const session = this.get(id);

    return Boolean(
      session &&
      session.state === "ACTIVE"
    );
  }

  transition(id, nextState) {
    const allowedStates = [
      "DECLARED",
      "ACTIVE",
      "SEALED",
      "ENDED"
    ];

    const session = this.get(id);

    if (
      !session ||
      !allowedStates.includes(nextState)
    ) {
      return false;
    }

    session.state = nextState;

    return true;
  }

  describe() {
    return {
      type: this.type,
      version: this.version,
      sessionCount: this.sessions.size
    };
  }

  clear() {
    this.sessions.clear();
  }
}

export function createNetConnectionSession(config) {
  return new NetConnectionSession(config);
}
