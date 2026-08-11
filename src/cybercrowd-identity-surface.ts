/**
 * CyberCrowd — Identity Surface
 *
 * ONE JOB:
 * Declare the raw CyberCrowd identity surface as a stable,
 * immutable, read-only artifact without interpreting, mutating,
 * or expanding the identity.
 *
 * This surface does not:
 * - interpret doctrine
 * - mutate CyberCrowd state
 * - mutate OSAR state
 * - mutate NET state
 * - expand lifecycle behavior
 * - create authority
 * - create identity
 * - execute governance
 * - execute organ behavior
 * - contact external services
 */

export interface CyberCrowdIdentitySurface {
  readonly declared: true;
  readonly declaredAt: string;
  readonly rawIdentity: unknown;
}

export const declareCyberCrowdIdentitySurface = (
  rawIdentity: unknown,
): CyberCrowdIdentitySurface =>
  Object.freeze({
    declared: true as const,
    declaredAt: new Date().toISOString(),
    rawIdentity,
  });
