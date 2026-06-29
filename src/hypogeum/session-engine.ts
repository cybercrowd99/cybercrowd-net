/**
 * src/hypogeum/session-engine.ts
 *
 * CyberCrowd Hypogeum — SessionEngine
 *
 * ONE JOB:
 * Hold the upper-level session state beneath the Arena.
 *
 * This is NOT login.
 * This is NOT token minting.
 * This is NOT payment.
 * This is NOT deletion.
 * This is NOT QR generation.
 * This is NOT lane authority by itself.
 *
 * SessionEngine says:
 * this QR4TH spine has an upper-level session presence inside the Hypogeum.
 */

import type {
  ContinuityHook,
  HypogeumFunction,
  HypogeumLevelId,
  HypogeumTransitionResult
} from "./hypogeum-kernel";

export type HypogeumSessionStatus =
  | "open"
  | "closed"
  | "blocked";

export interface HypogeumSessionInput {
  sessionId?: string;
  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;
  turnstileStorageId: string;
  continuityHook: ContinuityHook;
  momentRef: string;
}

export interface HypogeumSessionState {
  sessionId: string;

  level: "upper";
  functionRef: "session_engine";

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;
  turnstileStorageId: string;

  continuityHook: ContinuityHook;
  momentRef: string;

  status: HypogeumSessionStatus;

  turnstileEntry: true;
  presenceAttached: boolean;
  continuityAttached: boolean;
  laneTransitionLocked: boolean;

  lowerLevelAccess: false;
  paymentCreated: false;
  qrGenerated: false;
  deletionCreated: false;
  scanCreated: false;

  openedAt: string;
  closedAt: string | null;
  updatedAt: string;
}

export interface HypogeumSessionCheck {
  sessionId: string;
  allowed: boolean;
  status: HypogeumSessionStatus;

  identitySpineRef: "QR4TH_SPINE";
  level: "upper";
  functionRef: "session_engine";

  presenceAttached: boolean;
  continuityAttached: boolean;
  laneTransitionLocked: boolean;

  reason: string;
  checkedAt: string;
}

export class SessionEngine {
  private sessions: Map<string, HypogeumSessionState>;

  constructor() {
    this.sessions = new Map();
  }

  openSession(input: HypogeumSessionInput): HypogeumSessionState {
    this.assertInput(input);

    const now = new Date().toISOString();
    const sessionId = input.sessionId || this.makeId("HYPOGEUM_SESSION");

    const state: HypogeumSessionState = {
      sessionId,

      level: "upper",
      functionRef: "session_engine",

      identitySpineRef: input.identitySpineRef,
      cyberQRId: input.cyberQRId,
      identityId: input.identityId,
      turnstileStorageId: input.turnstileStorageId,

      continuityHook: input.continuityHook,
      momentRef: input.momentRef,

      status: "open",

      turnstileEntry: true,
      presenceAttached: true,
      continuityAttached: true,
      laneTransitionLocked: input.continuityHook === "lane_transition_lock",

      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false,

      openedAt: now,
      closedAt: null,
      updatedAt: now
    };

    this.sessions.set(sessionId, state);

    return this.cloneState(state);
  }

  verifySession(sessionId: string): HypogeumSessionCheck {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return {
        sessionId,
        allowed: false,
        status: "blocked",

        identitySpineRef: "QR4TH_SPINE",
        level: "upper",
        functionRef: "session_engine",

        presenceAttached: false,
        continuityAttached: false,
        laneTransitionLocked: false,

        reason: "HYPOGEUM_SESSION_NOT_FOUND",
        checkedAt: new Date().toISOString()
      };
    }

    if (session.status !== "open") {
      return {
        sessionId: session.sessionId,
        allowed: false,
        status: session.status,

        identitySpineRef: session.identitySpineRef,
        level: "upper",
        functionRef: "session_engine",

        presenceAttached: session.presenceAttached,
        continuityAttached: session.continuityAttached,
        laneTransitionLocked: session.laneTransitionLocked,

        reason: "HYPOGEUM_SESSION_NOT_OPEN",
        checkedAt: new Date().toISOString()
      };
    }

    if (
      session.identitySpineRef !== "QR4TH_SPINE" ||
      session.presenceAttached !== true ||
      session.continuityAttached !== true
    ) {
      return {
        sessionId: session.sessionId,
        allowed: false,
        status: "blocked",

        identitySpineRef: "QR4TH_SPINE",
        level: "upper",
        functionRef: "session_engine",

        presenceAttached: session.presenceAttached,
        continuityAttached: session.continuityAttached,
        laneTransitionLocked: session.laneTransitionLocked,

        reason: "HYPOGEUM_SESSION_SPINE_NOT_BOUND",
        checkedAt: new Date().toISOString()
      };
    }

    return {
      sessionId: session.sessionId,
      allowed: true,
      status: session.status,

      identitySpineRef: session.identitySpineRef,
      level: "upper",
      functionRef: "session_engine",

      presenceAttached: session.presenceAttached,
      continuityAttached: session.continuityAttached,
      laneTransitionLocked: session.laneTransitionLocked,

      reason: "HYPOGEUM_SESSION_ALLOWED",
      checkedAt: new Date().toISOString()
    };
  }

  closeSession(sessionId: string): HypogeumSessionState {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error("HYPOGEUM_SESSION_NOT_FOUND");
    }

    const now = new Date().toISOString();

    const closed: HypogeumSessionState = {
      ...session,
      status: "closed",
      closedAt: now,
      updatedAt: now,

      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.sessions.set(sessionId, closed);

    return this.cloneState(closed);
  }

  blockSession(sessionId: string): HypogeumSessionState {
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error("HYPOGEUM_SESSION_NOT_FOUND");
    }

    const now = new Date().toISOString();

    const blocked: HypogeumSessionState = {
      ...session,
      status: "blocked",
      updatedAt: now,

      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.sessions.set(sessionId, blocked);

    return this.cloneState(blocked);
  }

  requestUpperTransition(sessionId: string): HypogeumTransitionResult {
    const check = this.verifySession(sessionId);

    if (!check.allowed) {
      return {
        transitionId: this.makeId("HYPOGEUM_SESSION_TRANSITION_BLOCKED"),
        allowed: false,

        identitySpineRef: "QR4TH_SPINE",

        fromLevel: "upper",
        toLevel: "upper",
        functionRef: "session_engine",

        continuityHook: "identity_state_sync",
        laneAuthorityRef: "session",

        direction: "blocked",
        compressionApplied: false,
        turnstileRequired: true,
        turnstileAllowed: false,

        reason: check.reason,

        createdAt: new Date().toISOString()
      };
    }

    return {
      transitionId: this.makeId("HYPOGEUM_SESSION_TRANSITION"),
      allowed: true,

      identitySpineRef: "QR4TH_SPINE",

      fromLevel: "upper",
      toLevel: "upper",
      functionRef: "session_engine",

      continuityHook: "identity_state_sync",
      laneAuthorityRef: "session",

      direction: "downward",
      compressionApplied: true,
      turnstileRequired: true,
      turnstileAllowed: true,

      reason: "HYPOGEUM_UPPER_SESSION_TRANSITION_ALLOWED",

      createdAt: new Date().toISOString()
    };
  }

  readSession(sessionId: string): HypogeumSessionState | null {
    const session = this.sessions.get(sessionId);

    if (!session) return null;

    return this.cloneState(session);
  }

  listSessions(): HypogeumSessionState[] {
    return Array.from(this.sessions.values()).map((session) => this.cloneState(session));
  }

  private assertInput(input: HypogeumSessionInput): void {
    if (!input) {
      throw new Error("HYPOGEUM_SESSION_INPUT_REQUIRED");
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

    if (!input.turnstileStorageId || !input.turnstileStorageId.trim()) {
      throw new Error("TURNSTILE_STORAGE_ID_REQUIRED");
    }

    if (!input.continuityHook) {
      throw new Error("CONTINUITY_HOOK_REQUIRED");
    }

    if (!input.momentRef || !input.momentRef.trim()) {
      throw new Error("MOMENT_REF_REQUIRED");
    }
  }

  private cloneState(state: HypogeumSessionState): HypogeumSessionState {
    return {
      ...state,
      level: "upper",
      functionRef: "session_engine",
      identitySpineRef: "QR4TH_SPINE",
      turnstileEntry: true,
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

export const SESSION_ENGINE_LEVEL: HypogeumLevelId = "upper";
export const SESSION_ENGINE_FUNCTION: HypogeumFunction = "session_engine";
