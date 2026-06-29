/**
 * src/cyberqr/continuity-engine.ts
 *
 * CyberCrowd QR4 — ContinuityEngine
 *
 * ONE JOB:
 * Protect the QR Identity spine.
 *
 * QR Identity binds:
 * Order 1 — Public Identity
 * Order 2 — Private Identity
 * Order 3 — Value Identity
 * Order 4 — Continuity Identity
 *
 * This is NOT a QR code.
 * This is NOT a scanner.
 * This is NOT payment.
 * This is NOT lane access.
 * This is NOT deletion.
 * This does NOT generate symbols.
 *
 * ContinuityEngine says:
 * the four orders are still fused into one identity spine.
 */

import type { CyberQR, QR4Order } from "./turnstile-storage";

export type ContinuityStatus =
  | "continuous"
  | "broken"
  | "incomplete"
  | "outside_storage";

export interface ContinuityCheckResult {
  cyberQRId: string;
  continuityId: string | null;
  status: ContinuityStatus;

  publicIdentityBound: boolean;
  privateIdentityBound: boolean;
  valueIdentityBound: boolean;
  continuityIdentityBound: boolean;

  orderBindingCorrect: boolean;
  spinePresent: boolean;
  storageBound: boolean;

  protected: boolean;
  canEnterLane: boolean;

  errors: string[];

  checkedAt: string;
}

export interface ContinuitySnapshot {
  snapshotId: string;
  cyberQRId: string;
  continuityId: string;

  publicIdentityId: string;
  privateIdentityId: string;
  valueIdentityId: string;
  spineRef: string;

  orderBinding: [QR4Order, QR4Order, QR4Order, QR4Order];

  status: ContinuityStatus;
  protected: boolean;

  createdAt: string;
}

export class ContinuityEngine {
  verifySpine(cyberQR: CyberQR): ContinuityCheckResult {
    const errors: string[] = [];

    const publicIdentityBound = !!cyberQR?.publicIdentity?.identityId;
    const privateIdentityBound = !!cyberQR?.privateIdentity?.privateIdentityId;
    const valueIdentityBound = !!cyberQR?.valueIdentity?.valueIdentityId;
    const continuityIdentityBound = !!cyberQR?.continuityIdentity?.continuityId;

    if (!publicIdentityBound) errors.push("ORDER_1_PUBLIC_IDENTITY_MISSING");
    if (!privateIdentityBound) errors.push("ORDER_2_PRIVATE_IDENTITY_MISSING");
    if (!valueIdentityBound) errors.push("ORDER_3_VALUE_IDENTITY_MISSING");
    if (!continuityIdentityBound) errors.push("ORDER_4_CONTINUITY_IDENTITY_MISSING");

    const orderBindingCorrect = this.hasCorrectOrderBinding(cyberQR);
    if (!orderBindingCorrect) errors.push("QR4_ORDER_BINDING_INVALID");

    const spinePresent = !!cyberQR?.continuityIdentity?.spineRef;
    if (!spinePresent) errors.push("CONTINUITY_SPINE_REF_MISSING");

    const storageBound = !!cyberQR?.turnstileStorageId;
    if (!storageBound) errors.push("CYBERQR_OUTSIDE_TURNSTILE_STORAGE");

    if (cyberQR?.nonScannable !== true) {
      errors.push("CYBERQR_MUST_REMAIN_NON_SCANNABLE");
    }

    if (cyberQR?.humanDesigned !== true) {
      errors.push("CYBERQR_MUST_REMAIN_HUMAN_DESIGNED");
    }

    if (
      cyberQR?.duplicateAllowed !== false ||
      cyberQR?.copyAllowed !== false ||
      cyberQR?.transferAllowed !== false
    ) {
      errors.push("CYBERQR_DUPLICATE_COPY_TRANSFER_FORBIDDEN");
    }

    const complete =
      publicIdentityBound &&
      privateIdentityBound &&
      valueIdentityBound &&
      continuityIdentityBound;

    const protectedSpine =
      complete &&
      orderBindingCorrect &&
      spinePresent &&
      storageBound &&
      cyberQR.nonScannable === true &&
      cyberQR.humanDesigned === true &&
      cyberQR.duplicateAllowed === false &&
      cyberQR.copyAllowed === false &&
      cyberQR.transferAllowed === false;

    const status = this.resolveStatus({
      complete,
      storageBound,
      protectedSpine
    });

    return {
      cyberQRId: cyberQR?.cyberQRId || "",
      continuityId: cyberQR?.continuityIdentity?.continuityId || null,
      status,

      publicIdentityBound,
      privateIdentityBound,
      valueIdentityBound,
      continuityIdentityBound,

      orderBindingCorrect,
      spinePresent,
      storageBound,

      protected: protectedSpine,
      canEnterLane: protectedSpine,

      errors,

      checkedAt: new Date().toISOString()
    };
  }

  createSnapshot(cyberQR: CyberQR): ContinuitySnapshot {
    const result = this.verifySpine(cyberQR);

    if (!result.protected) {
      throw new Error("CONTINUITY_SPINE_NOT_PROTECTED");
    }

    return {
      snapshotId: this.makeId("CONTINUITY_SNAPSHOT"),
      cyberQRId: cyberQR.cyberQRId,
      continuityId: cyberQR.continuityIdentity.continuityId,

      publicIdentityId: cyberQR.publicIdentity.identityId,
      privateIdentityId: cyberQR.privateIdentity.privateIdentityId,
      valueIdentityId: cyberQR.valueIdentity.valueIdentityId,
      spineRef: cyberQR.continuityIdentity.spineRef,

      orderBinding: cyberQR.continuityIdentity.orderBinding,

      status: result.status,
      protected: result.protected,

      createdAt: new Date().toISOString()
    };
  }

  compareSnapshot(
    cyberQR: CyberQR,
    snapshot: ContinuitySnapshot
  ): ContinuityCheckResult {
    const result = this.verifySpine(cyberQR);
    const errors = [...result.errors];

    if (cyberQR.cyberQRId !== snapshot.cyberQRId) {
      errors.push("CYBERQR_ID_CHANGED");
    }

    if (cyberQR.continuityIdentity.continuityId !== snapshot.continuityId) {
      errors.push("CONTINUITY_ID_CHANGED");
    }

    if (cyberQR.publicIdentity.identityId !== snapshot.publicIdentityId) {
      errors.push("ORDER_1_PUBLIC_IDENTITY_CHANGED");
    }

    if (cyberQR.privateIdentity.privateIdentityId !== snapshot.privateIdentityId) {
      errors.push("ORDER_2_PRIVATE_IDENTITY_CHANGED");
    }

    if (cyberQR.valueIdentity.valueIdentityId !== snapshot.valueIdentityId) {
      errors.push("ORDER_3_VALUE_IDENTITY_CHANGED");
    }

    if (cyberQR.continuityIdentity.spineRef !== snapshot.spineRef) {
      errors.push("CONTINUITY_SPINE_REF_CHANGED");
    }

    const stillProtected = result.protected && errors.length === 0;

    return {
      ...result,
      status: stillProtected ? "continuous" : "broken",
      protected: stillProtected,
      canEnterLane: stillProtected,
      errors,
      checkedAt: new Date().toISOString()
    };
  }

  private hasCorrectOrderBinding(cyberQR: CyberQR): boolean {
    const binding = cyberQR?.continuityIdentity?.orderBinding;

    if (!Array.isArray(binding)) return false;
    if (binding.length !== 4) return false;

    return (
      binding[0] === "public_identity" &&
      binding[1] === "private_identity" &&
      binding[2] === "value_identity" &&
      binding[3] === "continuity_identity"
    );
  }

  private resolveStatus(input: {
    complete: boolean;
    storageBound: boolean;
    protectedSpine: boolean;
  }): ContinuityStatus {
    if (!input.storageBound) return "outside_storage";
    if (!input.complete) return "incomplete";
    if (!input.protectedSpine) return "broken";

    return "continuous";
  }

  private makeId(prefix: string): string {
    if (crypto && crypto.randomUUID) {
      return `${prefix}.${crypto.randomUUID()}`;
    }

    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }
}
