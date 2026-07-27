/**
 * NET Connection Runtime
 *
 * CyberCrowd NET connection runtime responsible for maintaining the declared
 * operational container for active NET connection sessions while preserving
 * CORE sovereignty separation and structural containment.
 *
 * The connection runtime hosts validated session context without creating
 * authority over CORE structures or executing business operations.
 *
 * Connection runtime responsibility:
 *
 * - Initialize declared connection runtime context
 * - Preserve connection identity
 * - Preserve session references
 * - Preserve source references
 * - Preserve destination references
 * - Preserve boundary references
 * - Preserve continuity references
 * - Preserve evidence relationships
 * - Maintain runtime state
 *
 * The connection runtime does not:
 *
 * - Create CORE sovereignty definitions
 * - Grant authority
 * - Modify CORE objects
 * - Execute CORE operations
 * - Authenticate identity
 * - Enforce policies
 * - Replace governance
 * - Deploy infrastructure
 * - Bypass boundaries
 *
 * Connection runtime definition precedes connection runtime operation.
 */

export const NET_CONNECTION_RUNTIME_TYPE =
  "NET_CONNECTION_RUNTIME";

export const NET_CONNECTION_RUNTIME_VERSION =
  "1.0.0";

export const NET_CONNECTION_RUNTIME_STATES = Object.freeze([
  "DECLARED",
  "INITIALIZED",
  "ACTIVE",
  "SEALED",
  "ENDED"
]);

export class NetConnectionRuntime {
  constructor({
    session = null
  } = {}) {
    this.type = NET_CONNECTION_RUNTIME_TYPE;
    this.version = NET_CONNECTION_RUNTIME_VERSION;

    this.session = session;

    this.runtimes = new Map();
  }

  initialize({
    id,
    sessionReference,
    connectionReference,
    sourceReference,
    destinationReference,
    boundaryReference = null,
    continuityReference = null,
    evidenceReference = null
  }) {
    const runtime = {
      id,
      sessionReference,
      connectionReference,
      sourceReference,
      destinationReference,
      boundaryReference,
      continuityReference,
      evidenceReference,
      state: "DECLARED"
    };

    if (
      this.session &&
      !this.session.isActive(sessionReference)
    ) {
      runtime.state = "ENDED";

      this.runtimes.set(id, runtime);

      return false;
    }

    runtime.state = "INITIALIZED";

    this.runtimes.set(id, runtime);

    return true;
  }

  activate(id) {
    const runtime = this.runtimes.get(id);

    if (!runtime) {
      return false;
    }

    runtime.state = "ACTIVE";

    return true;
  }

  get(id) {
    return this.runtimes.get(id) || null;
  }

  list() {
    return Array.from(this.runtimes.values());
  }

  isActive(id) {
    const runtime = this.get(id);

    return Boolean(
      runtime &&
      runtime.state === "ACTIVE"
    );
  }

  transition(id, nextState) {
    const allowedStates = [
      "DECLARED",
      "INITIALIZED",
      "ACTIVE",
      "SEALED",
      "ENDED"
    ];

    const runtime = this.get(id);

    if (
      !runtime ||
      !allowedStates.includes(nextState)
    ) {
      return false;
    }

    runtime.state = nextState;

    return true;
  }

  describe() {
    return {
      type: this.type,
      version: this.version,
      runtimeCount: this.runtimes.size
    };
  }

  clear() {
    this.runtimes.clear();
  }
}

export function createNetConnectionRuntime(config) {
  return new NetConnectionRuntime(config);
}
