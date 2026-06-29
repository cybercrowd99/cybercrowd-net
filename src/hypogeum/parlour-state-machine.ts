/**
 * src/hypogeum/parlour-state-machine.ts
 *
 * CyberCrowd Hypogeum — ParlourStateMachine
 *
 * ONE JOB:
 * Hold the filtered Capture Net output inside middle-level Parlour state.
 *
 * This is NOT CaptureNetProcessing.
 * This is NOT G6 routing.
 * This is NOT BloomLogic.
 * This is NOT SpongeLayer.
 * This is NOT payment.
 * This is NOT deletion.
 * This is NOT QR generation.
 * This is NOT scanning.
 *
 * ParlourStateMachine says:
 * the filtered middle-level signal is staged before lower-level Sponge access.
 */

import type {
  ContinuityHook,
  HypogeumFunction,
  HypogeumLevelId,
  HypogeumTransitionResult,
  LaneAuthorityRef
} from "./hypogeum-kernel";

import type {
  CaptureNetCheck,
  CaptureNetFilter,
  CaptureNetState
} from "./capture-net-processing";

import type { G6VectorPath } from "./g6-vector-routing";

export type ParlourStatus =
  | "created"
  | "staged"
  | "aligned"
  | "released"
  | "blocked";

export type ParlourMode =
  | "session_parlour"
  | "bloom_parlour"
  | "capture_net_parlour"
  | "deep_state_parlour"
  | "other";

export interface ParlourInput {
  parlourId?: string;

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;

  sessionId: string;
  bloomId: string;
  routeId: string;
  captureNetId: string;
  captureNetCheck: CaptureNetCheck;

  vectorPath: G6VectorPath;
  filter: CaptureNetFilter;
  mode: ParlourMode;

  continuityHook: ContinuityHook;
  laneAuthorityRef: LaneAuthorityRef;
  momentRef: string;
}

export interface ParlourState {
  parlourId: string;

  level: "middle";
  functionRef: "parlour_state_machine";

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;

  sessionId: string;
  bloomId: string;
  routeId: string;
  captureNetId: string;

  vectorPath: G6VectorPath;
  filter: CaptureNetFilter;
  mode: ParlourMode;

  continuityHook: ContinuityHook;
  laneAuthorityRef: LaneAuthorityRef;
  momentRef: string;

  status: ParlourStatus;

  captureNetVerified: boolean;
  signalStaged: boolean;
  ritualAligned: boolean;
  spongeReady: boolean;

  lowerLevelTransitionPrepared: boolean;
  spongeLayerCreated: false;

  paymentCreated: false;
  qrGenerated: false;
  deletionCreated: false;
  scanCreated: false;

  createdAt: string;
  stagedAt: string | null;
  alignedAt: string | null;
  releasedAt: string | null;
  updatedAt: string;
}

export interface ParlourCheck {
  parlourId: string;
  allowed: boolean;

  status: ParlourStatus;
  identitySpineRef: "QR4TH_SPINE";
  level: "middle";
  functionRef: "parlour_state_machine";

  captureNetVerified: boolean;
  signalStaged: boolean;
  ritualAligned: boolean;
  spongeReady: boolean;

  reason: string;
  checkedAt: string;
}

export class ParlourStateMachine {
  private parlours: Map<string, ParlourState>;

  constructor() {
    this.parlours = new Map();
  }

  createParlour(input: ParlourInput): ParlourState {
    this.assertInput(input);

    if (!input.captureNetCheck.allowed) {
      throw new Error("PARLOUR_REQUIRES_VERIFIED_CAPTURE_NET");
    }

    if (
      input.captureNetCheck.status !== "filtered" &&
      input.captureNetCheck.status !== "released"
    ) {
      throw new Error("PARLOUR_REQUIRES_FILTERED_CAPTURE_NET");
    }

    const now = new Date().toISOString();
    const parlourId = input.parlourId || this.makeId("HYPOGEUM_PARLOUR");

    const state: ParlourState = {
      parlourId,

      level: "middle",
      functionRef: "parlour_state_machine",

      identitySpineRef: input.identitySpineRef,
      cyberQRId: input.cyberQRId,
      identityId: input.identityId,

      sessionId: input.sessionId,
      bloomId: input.bloomId,
      routeId: input.routeId,
      captureNetId: input.captureNetId,

      vectorPath: input.vectorPath,
      filter: input.filter,
      mode: input.mode,

      continuityHook: input.continuityHook,
      laneAuthorityRef: input.laneAuthorityRef,
      momentRef: input.momentRef,

      status: "created",

      captureNetVerified: true,
      signalStaged: false,
      ritualAligned: false,
      spongeReady: false,

      lowerLevelTransitionPrepared: false,
      spongeLayerCreated: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false,

      createdAt: now,
      stagedAt: null,
      alignedAt: null,
      releasedAt: null,
      updatedAt: now
    };

    this.parlours.set(parlourId, state);

    return this.cloneState(state);
  }

  stageSignal(parlourId: string): ParlourState {
    const parlour = this.parlours.get(parlourId);

    if (!parlour) {
      throw new Error("PARLOUR_NOT_FOUND");
    }

    if (parlour.status !== "created") {
      throw new Error("PARLOUR_NOT_CREATED");
    }

    const now = new Date().toISOString();

    const staged: ParlourState = {
      ...parlour,
      status: "staged",
      signalStaged: true,
      stagedAt: now,
      updatedAt: now,

      ritualAligned: false,
      spongeReady: false,
      lowerLevelTransitionPrepared: false,
      spongeLayerCreated: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.parlours.set(parlourId, staged);

    return this.cloneState(staged);
  }

  alignRitual(parlourId: string): ParlourState {
    const parlour = this.parlours.get(parlourId);

    if (!parlour) {
      throw new Error("PARLOUR_NOT_FOUND");
    }

    if (parlour.status !== "staged") {
      throw new Error("PARLOUR_MUST_BE_STAGED_BEFORE_ALIGNMENT");
    }

    const now = new Date().toISOString();

    const aligned: ParlourState = {
      ...parlour,
      status: "aligned",
      ritualAligned: true,
      spongeReady: true,
      lowerLevelTransitionPrepared: true,
      alignedAt: now,
      updatedAt: now,

      spongeLayerCreated: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.parlours.set(parlourId, aligned);

    return this.cloneState(aligned);
  }

  releaseToSponge(parlourId: string): ParlourState {
    const parlour = this.parlours.get(parlourId);

    if (!parlour) {
      throw new Error("PARLOUR_NOT_FOUND");
    }

    if (parlour.status !== "aligned" || parlour.spongeReady !== true) {
      throw new Error("PARLOUR_NOT_READY_FOR_SPONGE");
    }

    const now = new Date().toISOString();

    const released: ParlourState = {
      ...parlour,
      status: "released",
      releasedAt: now,
      updatedAt: now,

      lowerLevelTransitionPrepared: true,
      spongeLayerCreated: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.parlours.set(parlourId, released);

    return this.cloneState(released);
  }

  blockParlour(parlourId: string): ParlourState {
    const parlour = this.parlours.get(parlourId);

    if (!parlour) {
      throw new Error("PARLOUR_NOT_FOUND");
    }

    const now = new Date().toISOString();

    const blocked: ParlourState = {
      ...parlour,
      status: "blocked",
      spongeReady: false,
      lowerLevelTransitionPrepared: false,
      updatedAt: now,

      spongeLayerCreated: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.parlours.set(parlourId, blocked);

    return this.cloneState(blocked);
  }

  verifyParlour(parlourId: string): ParlourCheck {
    const parlour = this.parlours.get(parlourId);

    if (!parlour) {
      return {
        parlourId,
        allowed: false,

        status: "blocked",
        identitySpineRef: "QR4TH_SPINE",
        level: "middle",
        functionRef: "parlour_state_machine",

        captureNetVerified: false,
        signalStaged: false,
        ritualAligned: false,
        spongeReady: false,

        reason: "PARLOUR_NOT_FOUND",
        checkedAt: new Date().toISOString()
      };
    }

    if (parlour.identitySpineRef !== "QR4TH_SPINE") {
      return this.blockedCheck(parlour, "QR4TH_SPINE_REQUIRED");
    }

    if (parlour.captureNetVerified !== true) {
      return this.blockedCheck(parlour, "CAPTURE_NET_NOT_VERIFIED");
    }

    if (parlour.signalStaged !== true) {
      return this.blockedCheck(parlour, "PARLOUR_SIGNAL_NOT_STAGED");
    }

    if (parlour.ritualAligned !== true) {
      return this.blockedCheck(parlour, "PARLOUR_RITUAL_NOT_ALIGNED");
    }

    if (parlour.spongeReady !== true) {
      return this.blockedCheck(parlour, "PARLOUR_NOT_SPONGE_READY");
    }

    if (parlour.status !== "aligned" && parlour.status !== "released") {
      return this.blockedCheck(parlour, "PARLOUR_NOT_READY");
    }

    return {
      parlourId: parlour.parlourId,
      allowed: true,

      status: parlour.status,
      identitySpineRef: "QR4TH_SPINE",
      level: "middle",
      functionRef: "parlour_state_machine",

      captureNetVerified: parlour.captureNetVerified,
      signalStaged: parlour.signalStaged,
      ritualAligned: parlour.ritualAligned,
      spongeReady: parlour.spongeReady,

      reason: "PARLOUR_ALLOWED",
      checkedAt: new Date().toISOString()
    };
  }

  requestSpongeTransition(parlourId: string): HypogeumTransitionResult {
    const check = this.verifyParlour(parlourId);
    const parlour = this.parlours.get(parlourId);

    if (!check.allowed || !parlour) {
      return {
        transitionId: this.makeId("HYPOGEUM_PARLOUR_SPONGE_TRANSITION_BLOCKED"),
        allowed: false,

        identitySpineRef: "QR4TH_SPINE",

        fromLevel: "middle",
        toLevel: "lower",
        functionRef: "sponge_layer",

        continuityHook: "presence_resonance" as ContinuityHook,
        laneAuthorityRef: "deep_state",

        direction: "blocked",
        compressionApplied: false,
        turnstileRequired: false,
        turnstileAllowed: false,

        reason: check.reason,

        createdAt: new Date().toISOString()
      };
    }

    return {
      transitionId: this.makeId("HYPOGEUM_PARLOUR_SPONGE_TRANSITION"),
      allowed: true,

      identitySpineRef: "QR4TH_SPINE",

      fromLevel: "middle",
      toLevel: "lower",
      functionRef: "sponge_layer",

      continuityHook: "moment_continuity",
      laneAuthorityRef: "deep_state",

      direction: "downward",
      compressionApplied: true,
      turnstileRequired: false,
      turnstileAllowed: false,

      reason: "HYPOGEUM_PARLOUR_TO_SPONGE_ALLOWED",

      createdAt: new Date().toISOString()
    };
  }

  readParlour(parlourId: string): ParlourState | null {
    const parlour = this.parlours.get(parlourId);

    if (!parlour) return null;

    return this.cloneState(parlour);
  }

  listParlours(): ParlourState[] {
    return Array.from(this.parlours.values()).map((parlour) => this.cloneState(parlour));
  }

  fromCaptureNetState(input: {
    captureNet: CaptureNetState;
    mode: ParlourMode;
    momentRef: string;
    continuityHook?: ContinuityHook;
    laneAuthorityRef?: LaneAuthorityRef;
  }): ParlourInput {
    if (
      input.captureNet.status !== "filtered" &&
      input.captureNet.status !== "released"
    ) {
      throw new Error("CAPTURE_NET_MUST_BE_FILTERED_FOR_PARLOUR");
    }

    if (input.captureNet.parlourReady !== true) {
      throw new Error("CAPTURE_NET_NOT_PARLOUR_READY");
    }

    return {
      identitySpineRef: "QR4TH_SPINE",
      cyberQRId: input.captureNet.cyberQRId,
      identityId: input.captureNet.identityId,

      sessionId: input.captureNet.sessionId,
      bloomId: input.captureNet.bloomId,
      routeId: input.captureNet.routeId,
      captureNetId: input.captureNet.captureNetId,

      captureNetCheck: {
        captureNetId: input.captureNet.captureNetId,
        allowed: true,
        status: input.captureNet.status,
        identitySpineRef: "QR4TH_SPINE",
        level: "middle",
        functionRef: "capture_net_processing",

        routeVerified: input.captureNet.routeVerified,
        vectorCaptured: input.captureNet.vectorCaptured,
        filterApplied: input.captureNet.filterApplied,
        parlourReady: input.captureNet.parlourReady,

        reason: "CAPTURE_NET_STATE_ACCEPTED_FOR_PARLOUR",
        checkedAt: new Date().toISOString()
      },

      vectorPath: input.captureNet.vectorPath,
      filter: input.captureNet.filter,
      mode: input.mode,

      continuityHook: input.continuityHook || "lane_transition_lock",
      laneAuthorityRef: input.laneAuthorityRef || "capture_net",
      momentRef: input.momentRef
    };
  }

  private assertInput(input: ParlourInput): void {
    if (!input) {
      throw new Error("PARLOUR_INPUT_REQUIRED");
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

    if (!input.bloomId || !input.bloomId.trim()) {
      throw new Error("BLOOM_ID_REQUIRED");
    }

    if (!input.routeId || !input.routeId.trim()) {
      throw new Error("G6_ROUTE_ID_REQUIRED");
    }

    if (!input.captureNetId || !input.captureNetId.trim()) {
      throw new Error("CAPTURE_NET_ID_REQUIRED");
    }

    if (!input.captureNetCheck) {
      throw new Error("CAPTURE_NET_CHECK_REQUIRED");
    }

    if (!input.vectorPath) {
      throw new Error("G6_VECTOR_PATH_REQUIRED");
    }

    if (!input.filter) {
      throw new Error("CAPTURE_NET_FILTER_REQUIRED");
    }

    if (!input.mode) {
      throw new Error("PARLOUR_MODE_REQUIRED");
    }

    if (!input.continuityHook) {
      throw new Error("CONTINUITY_HOOK_REQUIRED");
    }

    if (!input.laneAuthorityRef) {
      throw new Error("LANE_AUTHORITY_REF_REQUIRED");
    }

    if (!input.momentRef || !input.momentRef.trim()) {
      throw new Error("MOMENT_REF_REQUIRED");
    }
  }

  private blockedCheck(parlour: ParlourState, reason: string): ParlourCheck {
    return {
      parlourId: parlour.parlourId,
      allowed: false,

      status: parlour.status,
      identitySpineRef: "QR4TH_SPINE",
      level: "middle",
      functionRef: "parlour_state_machine",

      captureNetVerified: parlour.captureNetVerified,
      signalStaged: parlour.signalStaged,
      ritualAligned: parlour.ritualAligned,
      spongeReady: parlour.spongeReady,

      reason,
      checkedAt: new Date().toISOString()
    };
  }

  private cloneState(state: ParlourState): ParlourState {
    return {
      ...state,
      level: "middle",
      functionRef: "parlour_state_machine",
      identitySpineRef: "QR4TH_SPINE",
      spongeLayerCreated: false,
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

export const PARLOUR_STATE_MACHINE_LEVEL: HypogeumLevelId = "middle";
export const PARLOUR_STATE_MACHINE_FUNCTION: HypogeumFunction = "parlour_state_machine";
