/**
 * src/hypogeum/bloom-logic.ts
 *
 * CyberCrowd Hypogeum — BloomLogic
 *
 * ONE JOB:
 * Open middle-level bloom state from a verified upper session.
 *
 * This is NOT session_engine.
 * This is NOT G6 routing.
 * This is NOT Capture Net processing.
 * This is NOT Parlour state.
 * This is NOT payment.
 * This is NOT deletion.
 * This is NOT QR generation.
 * This is NOT scanning.
 *
 * BloomLogic says:
 * the QR4TH spine has moved from upper session presence into middle bloom logic.
 */

import type {
  ContinuityHook,
  HypogeumFunction,
  HypogeumLevelId,
  HypogeumTransitionResult
} from "./hypogeum-kernel";

import type {
  HypogeumSessionCheck,
  HypogeumSessionState
} from "./session-engine";

export type BloomStatus =
  | "dormant"
  | "open"
  | "compressed"
  | "released"
  | "blocked";

export type BloomSignal =
  | "creator_ready"
  | "crowd_ready"
  | "identity_ready"
  | "moment_ready"
  | "presence_ready"
  | "other";

export interface BloomInput {
  bloomId?: string;

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;

  sessionId: string;
  sessionCheck: HypogeumSessionCheck;

  signal: BloomSignal;
  continuityHook: ContinuityHook;
  momentRef: string;
}

export interface BloomState {
  bloomId: string;

  level: "middle";
  functionRef: "bloom_logic";

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;

  sessionId: string;
  signal: BloomSignal;
  continuityHook: ContinuityHook;
  momentRef: string;

  status: BloomStatus;

  upperSessionVerified: boolean;
  turnstileEntry: true;
  compressionApplied: boolean;
  resonanceOpen: boolean;

  routedToG6: false;
  captureNetCreated: false;
  parlourStateCreated: false;
  lowerLevelAccess: false;

  paymentCreated: false;
  qrGenerated: false;
  deletionCreated: false;
  scanCreated: false;

  openedAt: string;
  compressedAt: string | null;
  releasedAt: string | null;
  updatedAt: string;
}

export interface BloomCheck {
  bloomId: string;
  allowed: boolean;

  status: BloomStatus;
  identitySpineRef: "QR4TH_SPINE";
  level: "middle";
  functionRef: "bloom_logic";

  upperSessionVerified: boolean;
  compressionApplied: boolean;
  resonanceOpen: boolean;

  reason: string;
  checkedAt: string;
}

export class BloomLogic {
  private blooms: Map<string, BloomState>;

  constructor() {
    this.blooms = new Map();
  }

  openBloom(input: BloomInput): BloomState {
    this.assertInput(input);

    if (!input.sessionCheck.allowed) {
      throw new Error("BLOOM_REQUIRES_VERIFIED_UPPER_SESSION");
    }

    const now = new Date().toISOString();
    const bloomId = input.bloomId || this.makeId("HYPOGEUM_BLOOM");

    const state: BloomState = {
      bloomId,

      level: "middle",
      functionRef: "bloom_logic",

      identitySpineRef: input.identitySpineRef,
      cyberQRId: input.cyberQRId,
      identityId: input.identityId,

      sessionId: input.sessionId,
      signal: input.signal,
      continuityHook: input.continuityHook,
      momentRef: input.momentRef,

      status: "open",

      upperSessionVerified: true,
      turnstileEntry: true,
      compressionApplied: false,
      resonanceOpen: true,

      routedToG6: false,
      captureNetCreated: false,
      parlourStateCreated: false,
      lowerLevelAccess: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false,

      openedAt: now,
      compressedAt: null,
      releasedAt: null,
      updatedAt: now
    };

    this.blooms.set(bloomId, state);

    return this.cloneState(state);
  }

  compressBloom(bloomId: string): BloomState {
    const bloom = this.blooms.get(bloomId);

    if (!bloom) {
      throw new Error("BLOOM_NOT_FOUND");
    }

    if (bloom.status !== "open") {
      throw new Error("BLOOM_NOT_OPEN");
    }

    const now = new Date().toISOString();

    const compressed: BloomState = {
      ...bloom,
      status: "compressed",
      compressionApplied: true,
      resonanceOpen: true,
      compressedAt: now,
      updatedAt: now,

      routedToG6: false,
      captureNetCreated: false,
      parlourStateCreated: false,
      lowerLevelAccess: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.blooms.set(bloomId, compressed);

    return this.cloneState(compressed);
  }

  releaseBloom(bloomId: string): BloomState {
    const bloom = this.blooms.get(bloomId);

    if (!bloom) {
      throw new Error("BLOOM_NOT_FOUND");
    }

    if (bloom.status !== "compressed") {
      throw new Error("BLOOM_MUST_BE_COMPRESSED_BEFORE_RELEASE");
    }

    const now = new Date().toISOString();

    const released: BloomState = {
      ...bloom,
      status: "released",
      resonanceOpen: false,
      releasedAt: now,
      updatedAt: now,

      routedToG6: false,
      captureNetCreated: false,
      parlourStateCreated: false,
      lowerLevelAccess: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.blooms.set(bloomId, released);

    return this.cloneState(released);
  }

  blockBloom(bloomId: string): BloomState {
    const bloom = this.blooms.get(bloomId);

    if (!bloom) {
      throw new Error("BLOOM_NOT_FOUND");
    }

    const now = new Date().toISOString();

    const blocked: BloomState = {
      ...bloom,
      status: "blocked",
      resonanceOpen: false,
      lowerLevelAccess: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false,

      updatedAt: now
    };

    this.blooms.set(bloomId, blocked);

    return this.cloneState(blocked);
  }

  verifyBloom(bloomId: string): BloomCheck {
    const bloom = this.blooms.get(bloomId);

    if (!bloom) {
      return {
        bloomId,
        allowed: false,

        status: "blocked",
        identitySpineRef: "QR4TH_SPINE",
        level: "middle",
        functionRef: "bloom_logic",

        upperSessionVerified: false,
        compressionApplied: false,
        resonanceOpen: false,

        reason: "BLOOM_NOT_FOUND",
        checkedAt: new Date().toISOString()
      };
    }

    if (bloom.identitySpineRef !== "QR4TH_SPINE") {
      return this.blockedCheck(bloom, "QR4TH_SPINE_REQUIRED");
    }

    if (bloom.upperSessionVerified !== true) {
      return this.blockedCheck(bloom, "UPPER_SESSION_NOT_VERIFIED");
    }

    if (bloom.status === "blocked") {
      return this.blockedCheck(bloom, "BLOOM_BLOCKED");
    }

    if (bloom.status === "dormant") {
      return this.blockedCheck(bloom, "BLOOM_DORMANT");
    }

    return {
      bloomId: bloom.bloomId,
      allowed: true,

      status: bloom.status,
      identitySpineRef: "QR4TH_SPINE",
      level: "middle",
      functionRef: "bloom_logic",

      upperSessionVerified: bloom.upperSessionVerified,
      compressionApplied: bloom.compressionApplied,
      resonanceOpen: bloom.resonanceOpen,

      reason: "BLOOM_ALLOWED",
      checkedAt: new Date().toISOString()
    };
  }

  requestMiddleTransition(bloomId: string): HypogeumTransitionResult {
    const check = this.verifyBloom(bloomId);
    const bloom = this.blooms.get(bloomId);

    if (!check.allowed || !bloom) {
      return {
        transitionId: this.makeId("HYPOGEUM_BLOOM_TRANSITION_BLOCKED"),
        allowed: false,

        identitySpineRef: "QR4TH_SPINE",

        fromLevel: "upper",
        toLevel: "middle",
        functionRef: "bloom_logic",

        continuityHook: "moment_continuity",
        laneAuthorityRef: "bloom",

        direction: "blocked",
        compressionApplied: false,
        turnstileRequired: true,
        turnstileAllowed: false,

        reason: check.reason,

        createdAt: new Date().toISOString()
      };
    }

    return {
      transitionId: this.makeId("HYPOGEUM_BLOOM_TRANSITION"),
      allowed: true,

      identitySpineRef: "QR4TH_SPINE",

      fromLevel: "upper",
      toLevel: "middle",
      functionRef: "bloom_logic",

      continuityHook: bloom.continuityHook,
      laneAuthorityRef: "bloom",

      direction: "downward",
      compressionApplied: true,
      turnstileRequired: true,
      turnstileAllowed: true,

      reason: "HYPOGEUM_MIDDLE_BLOOM_TRANSITION_ALLOWED",

      createdAt: new Date().toISOString()
    };
  }

  readBloom(bloomId: string): BloomState | null {
    const bloom = this.blooms.get(bloomId);

    if (!bloom) return null;

    return this.cloneState(bloom);
  }

  listBlooms(): BloomState[] {
    return Array.from(this.blooms.values()).map((bloom) => this.cloneState(bloom));
  }

  fromSessionState(input: {
    session: HypogeumSessionState;
    signal: BloomSignal;
    momentRef: string;
    continuityHook?: ContinuityHook;
  }): BloomInput {
    if (input.session.status !== "open") {
      throw new Error("SESSION_MUST_BE_OPEN_FOR_BLOOM");
    }

    return {
      identitySpineRef: "QR4TH_SPINE",
      cyberQRId: input.session.cyberQRId,
      identityId: input.session.identityId,
      sessionId: input.session.sessionId,
      sessionCheck: {
        sessionId: input.session.sessionId,
        allowed: true,
        status: input.session.status,
        identitySpineRef: "QR4TH_SPINE",
        level: "upper",
        functionRef: "session_engine",
        presenceAttached: input.session.presenceAttached,
        continuityAttached: input.session.continuityAttached,
        laneTransitionLocked: input.session.laneTransitionLocked,
        reason: "SESSION_STATE_ACCEPTED_FOR_BLOOM",
        checkedAt: new Date().toISOString()
      },
      signal: input.signal,
      continuityHook: input.continuityHook || "moment_continuity",
      momentRef: input.momentRef
    };
  }

  private assertInput(input: BloomInput): void {
    if (!input) {
      throw new Error("BLOOM_INPUT_REQUIRED");
    }

    if (input.identitySpineRef !== "QR4TH_SPINE") {
      throw new Error("QR4TH_SPINE_REQUIRED");
    }

    if (!input.cyberQRId || !input.cyberQRId.trim()) {
      throw new Error("CYBERQR_ID_REQUIRED");
    }

    if (!input.identityId || !input.identityId.trim()) {
      throw new Error("IDENTITY_ID_REQUIRED");
    }

    if (!input.sessionId || !input.sessionId.trim()) {
      throw new Error("SESSION_ID_REQUIRED");
    }

    if (!input.sessionCheck) {
      throw new Error("SESSION_CHECK_REQUIRED");
    }

    if (!input.signal) {
      throw new Error("BLOOM_SIGNAL_REQUIRED");
    }

    if (!input.continuityHook) {
      throw new Error("CONTINUITY_HOOK_REQUIRED");
    }

    if (!input.momentRef || !input.momentRef.trim()) {
      throw new Error("MOMENT_REF_REQUIRED");
    }
  }

  private blockedCheck(bloom: BloomState, reason: string): BloomCheck {
    return {
      bloomId: bloom.bloomId,
      allowed: false,

      status: bloom.status,
      identitySpineRef: "QR4TH_SPINE",
      level: "middle",
      functionRef: "bloom_logic",

      upperSessionVerified: bloom.upperSessionVerified,
      compressionApplied: bloom.compressionApplied,
      resonanceOpen: bloom.resonanceOpen,

      reason,
      checkedAt: new Date().toISOString()
    };
  }

  private cloneState(state: BloomState): BloomState {
    return {
      ...state,
      level: "middle",
      functionRef: "bloom_logic",
      identitySpineRef: "QR4TH_SPINE",
      turnstileEntry: true,
      routedToG6: false,
      captureNetCreated: false,
      parlourStateCreated: false,
      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };
  }

  private makeId(prefix: string): string {
    if (crypto && crypto.randomUUID) {
      return `${prefix}.${crypto.randomUUID()}`;
    }

    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }
}

export const BLOOM_LOGIC_LEVEL: HypogeumLevelId = "middle";
export const BLOOM_LOGIC_FUNCTION: HypogeumFunction = "bloom_logic";
