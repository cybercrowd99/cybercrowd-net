/**
 * src/hypogeum/sponge-layer.ts
 *
 * CyberCrowd Hypogeum — SpongeLayer
 *
 * ONE JOB:
 * Absorb, buffer, and release lower-level pressure from a verified Parlour state.
 *
 * This is NOT ParlourStateMachine.
 * This is NOT CaptureNetProcessing.
 * This is NOT G6 routing.
 * This is NOT BloomLogic.
 * This is NOT exploit execution.
 * This is NOT malware analysis.
 * This is NOT payment.
 * This is NOT deletion.
 * This is NOT QR generation.
 * This is NOT scanning.
 *
 * SpongeLayer says:
 * lower-level pressure is absorbed, contained, and released without giving it a lane.
 */

import type {
  ContinuityHook,
  HypogeumFunction,
  HypogeumLevelId,
  HypogeumTransitionResult,
  LaneAuthorityRef,
  SpongeProtocol
} from "./hypogeum-kernel";

import type {
  ParlourCheck,
  ParlourMode,
  ParlourState
} from "./parlour-state-machine";

import type { CaptureNetFilter } from "./capture-net-processing";
import type { G6VectorPath } from "./g6-vector-routing";

export type SpongeStatus =
  | "created"
  | "absorbing"
  | "buffering"
  | "released"
  | "burned"
  | "blocked";

export type SpongePressure =
  | "low"
  | "medium"
  | "high"
  | "hostile"
  | "unknown";

export type SpongeReleaseMode =
  | "safe_release"
  | "burn_payload"
  | "decompress_only"
  | "hold_buffer"
  | "other";

export interface SpongeLayerInput {
  spongeId?: string;

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;

  sessionId: string;
  bloomId: string;
  routeId: string;
  captureNetId: string;
  parlourId: string;
  parlourCheck: ParlourCheck;

  vectorPath: G6VectorPath;
  filter: CaptureNetFilter;
  mode: ParlourMode;

  pressure: SpongePressure;
  protocol: SpongeProtocol;

  continuityHook: ContinuityHook;
  laneAuthorityRef: LaneAuthorityRef;
  momentRef: string;
}

export interface SpongeLayerState {
  spongeId: string;

  level: "lower";
  functionRef: "sponge_layer";

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;

  sessionId: string;
  bloomId: string;
  routeId: string;
  captureNetId: string;
  parlourId: string;

  vectorPath: G6VectorPath;
  filter: CaptureNetFilter;
  mode: ParlourMode;

  pressure: SpongePressure;
  protocol: SpongeProtocol;

  continuityHook: ContinuityHook;
  laneAuthorityRef: LaneAuthorityRef;
  momentRef: string;

  status: SpongeStatus;

  parlourVerified: boolean;
  lowerLevelEntry: true;
  turnstileEntry: false;

  absorbed: boolean;
  buffered: boolean;
  released: boolean;
  payloadBurned: boolean;

  laneGranted: false;
  executableLaneCreated: false;
  retryLaneCreated: false;

  paymentCreated: false;
  qrGenerated: false;
  deletionCreated: false;
  scanCreated: false;

  createdAt: string;
  absorbedAt: string | null;
  bufferedAt: string | null;
  releasedAt: string | null;
  burnedAt: string | null;
  updatedAt: string;
}

export interface SpongeLayerCheck {
  spongeId: string;
  allowed: boolean;

  status: SpongeStatus;
  identitySpineRef: "QR4TH_SPINE";
  level: "lower";
  functionRef: "sponge_layer";

  absorbed: boolean;
  buffered: boolean;
  released: boolean;
  payloadBurned: boolean;

  laneGranted: false;
  executableLaneCreated: false;

  reason: string;
  checkedAt: string;
}

export class SpongeLayer {
  private sponges: Map<string, SpongeLayerState>;

  constructor() {
    this.sponges = new Map();
  }

  createSponge(input: SpongeLayerInput): SpongeLayerState {
    this.assertInput(input);

    if (!input.parlourCheck.allowed) {
      throw new Error("SPONGE_REQUIRES_VERIFIED_PARLOUR");
    }

    if (
      input.parlourCheck.status !== "aligned" &&
      input.parlourCheck.status !== "released"
    ) {
      throw new Error("SPONGE_REQUIRES_ALIGNED_PARLOUR");
    }

    const now = new Date().toISOString();
    const spongeId = input.spongeId || this.makeId("HYPOGEUM_SPONGE");

    const state: SpongeLayerState = {
      spongeId,

      level: "lower",
      functionRef: "sponge_layer",

      identitySpineRef: input.identitySpineRef,
      cyberQRId: input.cyberQRId,
      identityId: input.identityId,

      sessionId: input.sessionId,
      bloomId: input.bloomId,
      routeId: input.routeId,
      captureNetId: input.captureNetId,
      parlourId: input.parlourId,

      vectorPath: input.vectorPath,
      filter: input.filter,
      mode: input.mode,

      pressure: input.pressure,
      protocol: input.protocol,

      continuityHook: input.continuityHook,
      laneAuthorityRef: input.laneAuthorityRef,
      momentRef: input.momentRef,

      status: "created",

      parlourVerified: true,
      lowerLevelEntry: true,
      turnstileEntry: false,

      absorbed: false,
      buffered: false,
      released: false,
      payloadBurned: false,

      laneGranted: false,
      executableLaneCreated: false,
      retryLaneCreated: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false,

      createdAt: now,
      absorbedAt: null,
      bufferedAt: null,
      releasedAt: null,
      burnedAt: null,
      updatedAt: now
    };

    this.sponges.set(spongeId, state);

    return this.cloneState(state);
  }

  absorb(spongeId: string): SpongeLayerState {
    const sponge = this.sponges.get(spongeId);

    if (!sponge) {
      throw new Error("SPONGE_NOT_FOUND");
    }

    if (sponge.status !== "created") {
      throw new Error("SPONGE_NOT_CREATED");
    }

    const now = new Date().toISOString();

    const absorbed: SpongeLayerState = {
      ...sponge,
      status: "absorbing",
      protocol: "absorb",
      absorbed: true,
      absorbedAt: now,
      updatedAt: now,

      laneGranted: false,
      executableLaneCreated: false,
      retryLaneCreated: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.sponges.set(spongeId, absorbed);

    return this.cloneState(absorbed);
  }

  buffer(spongeId: string): SpongeLayerState {
    const sponge = this.sponges.get(spongeId);

    if (!sponge) {
      throw new Error("SPONGE_NOT_FOUND");
    }

    if (sponge.status !== "absorbing" || sponge.absorbed !== true) {
      throw new Error("SPONGE_MUST_ABSORB_BEFORE_BUFFER");
    }

    const now = new Date().toISOString();

    const buffered: SpongeLayerState = {
      ...sponge,
      status: "buffering",
      protocol: "buffer",
      buffered: true,
      bufferedAt: now,
      updatedAt: now,

      laneGranted: false,
      executableLaneCreated: false,
      retryLaneCreated: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.sponges.set(spongeId, buffered);

    return this.cloneState(buffered);
  }

  release(spongeId: string, mode: SpongeReleaseMode = "safe_release"): SpongeLayerState {
    const sponge = this.sponges.get(spongeId);

    if (!sponge) {
      throw new Error("SPONGE_NOT_FOUND");
    }

    if (sponge.status !== "buffering" || sponge.buffered !== true) {
      throw new Error("SPONGE_MUST_BUFFER_BEFORE_RELEASE");
    }

    if (mode === "burn_payload") {
      return this.burnPayload(spongeId);
    }

    const now = new Date().toISOString();

    const released: SpongeLayerState = {
      ...sponge,
      status: "released",
      protocol: "release",
      released: true,
      releasedAt: now,
      updatedAt: now,

      laneGranted: false,
      executableLaneCreated: false,
      retryLaneCreated: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.sponges.set(spongeId, released);

    return this.cloneState(released);
  }

  burnPayload(spongeId: string): SpongeLayerState {
    const sponge = this.sponges.get(spongeId);

    if (!sponge) {
      throw new Error("SPONGE_NOT_FOUND");
    }

    if (sponge.absorbed !== true) {
      throw new Error("SPONGE_MUST_ABSORB_BEFORE_BURN");
    }

    const now = new Date().toISOString();

    const burned: SpongeLayerState = {
      ...sponge,
      status: "burned",
      protocol: "release",
      released: false,
      payloadBurned: true,
      burnedAt: now,
      updatedAt: now,

      laneGranted: false,
      executableLaneCreated: false,
      retryLaneCreated: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.sponges.set(spongeId, burned);

    return this.cloneState(burned);
  }

  blockSponge(spongeId: string): SpongeLayerState {
    const sponge = this.sponges.get(spongeId);

    if (!sponge) {
      throw new Error("SPONGE_NOT_FOUND");
    }

    const now = new Date().toISOString();

    const blocked: SpongeLayerState = {
      ...sponge,
      status: "blocked",
      released: false,
      payloadBurned: false,
      updatedAt: now,

      laneGranted: false,
      executableLaneCreated: false,
      retryLaneCreated: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.sponges.set(spongeId, blocked);

    return this.cloneState(blocked);
  }

  verifySponge(spongeId: string): SpongeLayerCheck {
    const sponge = this.sponges.get(spongeId);

    if (!sponge) {
      return {
        spongeId,
        allowed: false,

        status: "blocked",
        identitySpineRef: "QR4TH_SPINE",
        level: "lower",
        functionRef: "sponge_layer",

        absorbed: false,
        buffered: false,
        released: false,
        payloadBurned: false,

        laneGranted: false,
        executableLaneCreated: false,

        reason: "SPONGE_NOT_FOUND",
        checkedAt: new Date().toISOString()
      };
    }

    if (sponge.identitySpineRef !== "QR4TH_SPINE") {
      return this.blockedCheck(sponge, "QR4TH_SPINE_REQUIRED");
    }

    if (sponge.parlourVerified !== true) {
      return this.blockedCheck(sponge, "PARLOUR_NOT_VERIFIED");
    }

    if (sponge.lowerLevelEntry !== true || sponge.turnstileEntry !== false) {
      return this.blockedCheck(sponge, "SPONGE_LAYER_ENTRY_RULE_INVALID");
    }

    if (sponge.laneGranted !== false || sponge.executableLaneCreated !== false) {
      return this.blockedCheck(sponge, "SPONGE_MUST_NOT_CREATE_LANE");
    }

    if (sponge.status === "blocked") {
      return this.blockedCheck(sponge, "SPONGE_BLOCKED");
    }

    return {
      spongeId: sponge.spongeId,
      allowed: true,

      status: sponge.status,
      identitySpineRef: "QR4TH_SPINE",
      level: "lower",
      functionRef: "sponge_layer",

      absorbed: sponge.absorbed,
      buffered: sponge.buffered,
      released: sponge.released,
      payloadBurned: sponge.payloadBurned,

      laneGranted: false,
      executableLaneCreated: false,

      reason: "SPONGE_ALLOWED",
      checkedAt: new Date().toISOString()
    };
  }

  requestDeepStateTransition(spongeId: string): HypogeumTransitionResult {
    const check = this.verifySponge(spongeId);

    if (!check.allowed) {
      return {
        transitionId: this.makeId("HYPOGEUM_SPONGE_DEEP_STATE_TRANSITION_BLOCKED"),
        allowed: false,

        identitySpineRef: "QR4TH_SPINE",

        fromLevel: "lower",
        toLevel: "lower",
        functionRef: "deep_state_buffers",

        continuityHook: "moment_continuity",
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
      transitionId: this.makeId("HYPOGEUM_SPONGE_DEEP_STATE_TRANSITION"),
      allowed: true,

      identitySpineRef: "QR4TH_SPINE",

      fromLevel: "lower",
      toLevel: "lower",
      functionRef: "deep_state_buffers",

      continuityHook: "moment_continuity",
      laneAuthorityRef: "deep_state",

      direction: "downward",
      compressionApplied: true,
      turnstileRequired: false,
      turnstileAllowed: false,

      reason: "HYPOGEUM_SPONGE_TO_DEEP_STATE_ALLOWED",

      createdAt: new Date().toISOString()
    };
  }

  readSponge(spongeId: string): SpongeLayerState | null {
    const sponge = this.sponges.get(spongeId);

    if (!sponge) return null;

    return this.cloneState(sponge);
  }

  listSponges(): SpongeLayerState[] {
    return Array.from(this.sponges.values()).map((sponge) => this.cloneState(sponge));
  }

  fromParlourState(input: {
    parlour: ParlourState;
    pressure: SpongePressure;
    protocol?: SpongeProtocol;
    momentRef: string;
    continuityHook?: ContinuityHook;
    laneAuthorityRef?: LaneAuthorityRef;
  }): SpongeLayerInput {
    if (
      input.parlour.status !== "aligned" &&
      input.parlour.status !== "released"
    ) {
      throw new Error("PARLOUR_MUST_BE_ALIGNED_FOR_SPONGE");
    }

    if (input.parlour.spongeReady !== true) {
      throw new Error("PARLOUR_NOT_SPONGE_READY");
    }

    return {
      identitySpineRef: "QR4TH_SPINE",
      cyberQRId: input.parlour.cyberQRId,
      identityId: input.parlour.identityId,

      sessionId: input.parlour.sessionId,
      bloomId: input.parlour.bloomId,
      routeId: input.parlour.routeId,
      captureNetId: input.parlour.captureNetId,
      parlourId: input.parlour.parlourId,

      parlourCheck: {
        parlourId: input.parlour.parlourId,
        allowed: true,

        status: input.parlour.status,
        identitySpineRef: "QR4TH_SPINE",
        level: "middle",
        functionRef: "parlour_state_machine",

        captureNetVerified: input.parlour.captureNetVerified,
        signalStaged: input.parlour.signalStaged,
        ritualAligned: input.parlour.ritualAligned,
        spongeReady: input.parlour.spongeReady,

        reason: "PARLOUR_STATE_ACCEPTED_FOR_SPONGE",
        checkedAt: new Date().toISOString()
      },

      vectorPath: input.parlour.vectorPath,
      filter: input.parlour.filter,
      mode: input.parlour.mode,

      pressure: input.pressure,
      protocol: input.protocol || "absorb",

      continuityHook: input.continuityHook || "moment_continuity",
      laneAuthorityRef: input.laneAuthorityRef || "deep_state",
      momentRef: input.momentRef
    };
  }

  private assertInput(input: SpongeLayerInput): void {
    if (!input) {
      throw new Error("SPONGE_INPUT_REQUIRED");
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

    if (!input.parlourId || !input.parlourId.trim()) {
      throw new Error("PARLOUR_ID_REQUIRED");
    }

    if (!input.parlourCheck) {
      throw new Error("PARLOUR_CHECK_REQUIRED");
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

    if (!input.pressure) {
      throw new Error("SPONGE_PRESSURE_REQUIRED");
    }

    if (!input.protocol) {
      throw new Error("SPONGE_PROTOCOL_REQUIRED");
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

  private blockedCheck(sponge: SpongeLayerState, reason: string): SpongeLayerCheck {
    return {
      spongeId: sponge.spongeId,
      allowed: false,

      status: sponge.status,
      identitySpineRef: "QR4TH_SPINE",
      level: "lower",
      functionRef: "sponge_layer",

      absorbed: sponge.absorbed,
      buffered: sponge.buffered,
      released: sponge.released,
      payloadBurned: sponge.payloadBurned,

      laneGranted: false,
      executableLaneCreated: false,

      reason,
      checkedAt: new Date().toISOString()
    };
  }

  private cloneState(state: SpongeLayerState): SpongeLayerState {
    return {
      ...state,
      level: "lower",
      functionRef: "sponge_layer",
      identitySpineRef: "QR4TH_SPINE",
      lowerLevelEntry: true,
      turnstileEntry: false,
      laneGranted: false,
      executableLaneCreated: false,
      retryLaneCreated: false,
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

export const SPONGE_LAYER_LEVEL: HypogeumLevelId = "lower";
export const SPONGE_LAYER_FUNCTION: HypogeumFunction = "sponge_layer";
