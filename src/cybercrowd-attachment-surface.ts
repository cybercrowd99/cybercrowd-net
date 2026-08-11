/**
 * CyberCrowd — Attachment Surface
 *
 * ONE JOB:
 * Attach the declared CyberCrowd identity surface into the CyberCrowd
 * root-organ pipeline without interpreting, mutating, or expanding the
 * identity.
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

import type { CyberCrowdIdentitySurface } from "./cybercrowd-identity-surface";

export interface CyberCrowdAttachmentSurface {
  readonly attached: true;
  readonly attachedAt: string;
  readonly identity: CyberCrowdIdentitySurface;
}

export const attachCyberCrowdIdentitySurface = (
  identity: CyberCrowdIdentitySurface,
): CyberCrowdAttachmentSurface =>
  Object.freeze({
    attached: true as const,
    attachedAt: new Date().toISOString(),
    identity,
  });
