/**
 * NET Connection Validator
 *
 * CyberCrowd NET connection validator responsible for examining declared
 * connection structures within the NET environment while preserving CORE
 * sovereignty separation and structural containment.
 *
 * The connection validator confirms structural completeness without creating
 * authority over CORE structures or modifying connected systems.
 *
 * Connection validator responsibility:
 *
 * - Confirm connection identity
 * - Confirm connection type references
 * - Confirm source references
 * - Confirm destination references
 * - Confirm boundary references
 * - Confirm continuity references
 * - Confirm resolution awareness
 * - Preserve evidence relationships
 * - Produce validation state
 *
 * The connection validator does not:
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
 * Connection validation precedes connection routing.
 */

export const NET_CONNECTION_VALIDATOR_TYPE =
  "NET_CONNECTION_VALIDATOR";

export const NET_CONNECTION_VALIDATOR_VERSION =
  "1.0.0";

export const NET_CONNECTION_VALIDATION_STATES = Object.freeze([
  "DECLARED",
  "VALID",
  "INVALID",
  "SEALED"
]);

export class NetConnectionValidator {
  constructor({
    registry = null,
    resolver = null
  } = {}) {
    this.type = NET_CONNECTION_VALIDATOR_TYPE;
    this.version = NET_CONNECTION_VALIDATOR_VERSION;

    this.registry = registry;
    this.resolver = resolver;

    this.validations = new Map();
  }

  validate({
    id,
    connectionReference,
    sourceReference,
    targetReference,
    boundaryReference = null,
    continuityReference = null,
    evidenceReference = null
  }) {
    const validation = {
      id,
      connectionReference,
      sourceReference,
      targetReference,
      boundaryReference,
      continuityReference,
      evidenceReference,
      state: "DECLARED"
    };

    const connection = this.registry
      ? this.registry.get(connectionReference)
      : null;

    if (!connection) {
      validation.state = "INVALID";
      this.validations.set(id, validation);
      return false;
    }

    if (
      connection.sourceReference !== sourceReference ||
      connection.targetReference !== targetReference
    ) {
      validation.state = "INVALID";
      this.validations.set(id, validation);
      return false;
    }

    if (
      boundaryReference &&
      connection.boundaryReference !== boundaryReference
    ) {
      validation.state = "INVALID";
      this.validations.set(id, validation);
      return false;
    }

    if (
      continuityReference &&
      connection.continuityReference !== continuityReference
    ) {
      validation.state = "INVALID";
      this.validations.set(id, validation);
      return false;
    }

    validation.state = "VALID";

    this.validations.set(id, validation);

    return true;
  }

  get(id) {
    return this.validations.get(id) || null;
  }

  list() {
    return Array.from(this.validations.values());
  }

  isValid(id) {
    const validation = this.get(id);

    return Boolean(
      validation &&
      validation.state === "VALID"
    );
  }

  describe() {
    return {
      type: this.type,
      version: this.version,
      validationCount: this.validations.size
    };
  }

  clear() {
    this.validations.clear();
  }
}

export function createNetConnectionValidator(config) {
  return new NetConnectionValidator(config);
}
