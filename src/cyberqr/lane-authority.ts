/**
 * src/cyberqr/lane-authority.ts
 *
 * CyberCrowd QR4 — LaneAuthority
 *
 * ONE JOB:
 * Decide whether a protected QR Identity spine may enter a lane.
 *
 * This is NOT a QR code.
 * This is NOT a scanner.
 * This is NOT payment.
 * This is NOT deletion.
 * This does NOT generate symbols.
 * This does NOT override ContinuityEngine.
 *
 * LaneAuthority says:
 * this QR Identity can or cannot enter this lane.
 */

import type { CyberQR, LaneId, TurnstileStorageState } from "./turnstile-storage";
import type { ContinuityCheckResult, ContinuityEngine } from "./continuity-engine";

export type LaneAuthorityDecision =
  | "granted"
  | "blocked";

export type LaneAuthorityReason =
  | "lane_granted"
  | "lane_missing"
  | "identity_not_verified"
  | "presence_not_verified"
  | "continuity_not_protected"
  | "storage_mismatch"
  | "scope_not_allowed"
  | "other";

export interface LaneAuthorityRequest {
  laneId: LaneId;
  requestedScope: string;
  requestedAt: string;
}

export interface LaneAuthorityGrant {
  grantId: string;

  cyberQRId: string;
  continuityId: string;
  laneId: LaneId;

  requestedScope: string;

  decision: LaneAuthorityDecision;
  reason: LaneAuthorityReason;

  identityVerified: boolean;
  presenceVerified: boolean;
  continuityProtected: boolean;
  storageBound: boolean;

  active: boolean;
  revoked: false;

  paymentCreated: false;
  scanCreated: false;
  deletionCreated: false;
  symbolGenerated: false;

  createdAt: string;
}

export interface LaneAuthorityState {
  cyberQRId: string;
  activeLaneId: LaneId | null;
  activeGrantId: string | null;

  canEnterLane: boolean;
  lastDecision: LaneAuthorityDecision | null;
  lastReason: LaneAuthorityReason | null;

  updatedAt: string;
}

export class LaneAuthority {
  private state: LaneAuthorityState;

  constructor(cyberQRId: string) {
    this.state = {
      cyberQRId,
      activeLaneId: null,
      activeGrantId: null,
      canEnterLane: false,
      lastDecision: null,
      lastReason: null,
      updatedAt: new Date().toISOString()
    };
  }

  requestLaneAccess(input: {
    cyberQR: CyberQR;
    laneId: LaneId;
    requestedScope: string;
    turnstileState: TurnstileStorageState;
    continuityEngine: ContinuityEngine;
    allowedScopes: string[];
  }): LaneAuthorityGrant {
    const now = new Date().toISOString();

    const continuity = input.continuityEngine.verifySpine(input.cyberQR);

    const reason = this.resolveReason({
      cyberQR: input.cyberQR,
      laneId: input.laneId,
      requestedScope: input.requestedScope,
      turnstileState: input.turnstileState,
      continuity,
      allowedScopes: input.allowedScopes
    });

    const decision: LaneAuthorityDecision =
      reason === "lane_granted" ? "granted" : "blocked";

    const grant: LaneAuthorityGrant = {
      grantId: this.makeId("LANE_AUTHORITY_GRANT"),

      cyberQRId: input.cyberQR.cyberQRId,
      continuityId: input.cyberQR.continuityIdentity.continuityId,
      laneId: input.laneId,

      requestedScope: input.requestedScope,

      decision,
      reason,

      identityVerified: input.turnstileState.identityVerified === true,
      presenceVerified: input.turnstileState.presenceVerified === true,
      continuityProtected: continuity.protected === true,
      storageBound: input.cyberQR.turnstileStorageId === input.turnstileState.storageId,

      active: decision === "granted",
      revoked: false,

      paymentCreated: false,
      scanCreated: false,
      deletionCreated: false,
      symbolGenerated: false,

      createdAt: now
    };

    this.state = {
      cyberQRId: input.cyberQR.cyberQRId,
      activeLaneId: grant.active ? input.laneId : null,
      activeGrantId: grant.active ? grant.grantId : null,
      canEnterLane: grant.active,
      lastDecision: decision,
      lastReason: reason,
      updatedAt: now
    };

    return grant;
  }

  exitLane(input: {
    cyberQR: CyberQR;
    laneId: LaneId;
  }): LaneAuthorityState {
    if (input.cyberQR.cyberQRId !== this.state.cyberQRId) {
      throw new Error("LANE_AUTHORITY_CYBERQR_MISMATCH");
    }

    if (this.state.activeLaneId !== input.laneId) {
      throw new Error("CYBERQR_NOT_ACTIVE_IN_REQUESTED_LANE");
    }

    this.state = {
      ...this.state,
      activeLaneId: null,
      activeGrantId: null,
      canEnterLane: false,
      updatedAt: new Date().toISOString()
    };

    return this.readState();
  }

  readState(): LaneAuthorityState {
    return {
      ...this.state
    };
  }

  private resolveReason(input: {
    cyberQR: CyberQR;
    laneId: LaneId;
    requestedScope: string;
    turnstileState: TurnstileStorageState;
    continuity: ContinuityCheckResult;
    allowedScopes: string[];
  }): LaneAuthorityReason {
    if (!input.laneId || !input.laneId.trim()) {
      return "lane_missing";
    }

    if (input.turnstileState.identityVerified !== true) {
      return "identity_not_verified";
    }

    if (input.turnstileState.presenceVerified !== true) {
      return "presence_not_verified";
    }

    if (input.continuity.protected !== true) {
      return "continuity_not_protected";
    }

    if (input.cyberQR.turnstileStorageId !== input.turnstileState.storageId) {
      return "storage_mismatch";
    }

    if (!input.allowedScopes.includes(input.requestedScope)) {
      return "scope_not_allowed";
    }

    return "lane_granted";
  }

  private makeId(prefix: string): string {
    if (crypto && crypto.randomUUID) {
      return `${prefix}.${crypto.randomUUID()}`;
    }

    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }
}
