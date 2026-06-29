/**
 * src/hypogeum/capture-net-processing.ts
 *
 * CyberCrowd Hypogeum — CaptureNetProcessing
 *
 * ONE JOB:
 * Capture a verified G6 vector route into a middle-level processing net.
 *
 * This is NOT G6 routing.
 * This is NOT BloomLogic.
 * This is NOT Parlour state.
 * This is NOT lower-level Sponge.
 * This is NOT payment.
 * This is NOT deletion.
 * This is NOT QR generation.
 * This is NOT scanning.
 *
 * CaptureNetProcessing says:
 * the routed G6 vector is held, filtered, and prepared for Parlour state.
 */

import type {
  ContinuityHook,
  HypogeumFunction,
  HypogeumLevelId,
  HypogeumTransitionResult,
  LaneAuthorityRef
} from "./hypogeum-kernel";

import type {
  G6VectorPath,
  G6VectorRouteCheck,
  G6VectorRouteState
} from "./g6-vector-routing";

export type CaptureNetStatus =
  | "created"
  | "holding"
  | "filtered"
  | "released"
  | "blocked";

export type CaptureNetFilter =
  | "identity_signal"
  | "creator_signal"
  | "crowd_signal"
  | "moment_signal"
  | "presence_signal"
  | "other";

export interface CaptureNetInput {
  captureNetId?: string;

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;

  sessionId: string;
  bloomId: string;
  routeId: string;
  routeCheck: G6VectorRouteCheck;

  vectorPath: G6VectorPath;
  filter: CaptureNetFilter;

  continuityHook: ContinuityHook;
  laneAuthorityRef: LaneAuthorityRef;
  momentRef: string;
}

export interface CaptureNetState {
  captureNetId: string;

  level: "middle";
  functionRef: "capture_net_processing";

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;

  sessionId: string;
  bloomId: string;
  routeId: string;

  vectorPath: G6VectorPath;
  filter: CaptureNetFilter;

  continuityHook: ContinuityHook;
  laneAuthorityRef: LaneAuthorityRef;
  momentRef: string;

  status: CaptureNetStatus;

  routeVerified: boolean;
  vectorCaptured: boolean;
  filterApplied: boolean;
  parlourReady: boolean;

  parlourStateCreated: false;
  lowerLevelAccess: false;

  paymentCreated: false;
  qrGenerated: false;
  deletionCreated: false;
  scanCreated: false;

  createdAt: string;
  heldAt: string | null;
  filteredAt: string | null;
  releasedAt: string | null;
  updatedAt: string;
}

export interface CaptureNetCheck {
  captureNetId: string;
  allowed: boolean;

  status: CaptureNetStatus;
  identitySpineRef: "QR4TH_SPINE";
  level: "middle";
  functionRef: "capture_net_processing";

  routeVerified: boolean;
  vectorCaptured: boolean;
  filterApplied: boolean;
  parlourReady: boolean;

  reason: string;
  checkedAt: string;
}

export class CaptureNetProcessing {
  private nets: Map<string, CaptureNetState>;

  constructor() {
    this.nets = new Map();
  }

  createCaptureNet(input: CaptureNetInput): CaptureNetState {
    this.assertInput(input);

    if (!input.routeCheck.allowed) {
      throw new Error("CAPTURE_NET_REQUIRES_VERIFIED_G6_ROUTE");
    }

    if (input.routeCheck.status !== "routed") {
      throw new Error("CAPTURE_NET_REQUIRES_OPEN_G6_ROUTE");
    }

    const now = new Date().toISOString();
    const captureNetId = input.captureNetId || this.makeId("HYPOGEUM_CAPTURE_NET");

    const state: CaptureNetState = {
      captureNetId,

      level: "middle",
      functionRef: "capture_net_processing",

      identitySpineRef: input.identitySpineRef,
      cyberQRId: input.cyberQRId,
      identityId: input.identityId,

      sessionId: input.sessionId,
      bloomId: input.bloomId,
      routeId: input.routeId,

      vectorPath: input.vectorPath,
      filter: input.filter,

      continuityHook: input.continuityHook,
      laneAuthorityRef: input.laneAuthorityRef,
      momentRef: input.momentRef,

      status: "created",

      routeVerified: true,
      vectorCaptured: false,
      filterApplied: false,
      parlourReady: false,

      parlourStateCreated: false,
      lowerLevelAccess: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false,

      createdAt: now,
      heldAt: null,
      filteredAt: null,
      releasedAt: null,
      updatedAt: now
    };

    this.nets.set(captureNetId, state);

    return this.cloneState(state);
  }

  holdVector(captureNetId: string): CaptureNetState {
    const net = this.nets.get(captureNetId);

    if (!net) {
      throw new Error("CAPTURE_NET_NOT_FOUND");
    }

    if (net.status !== "created") {
      throw new Error("CAPTURE_NET_NOT_CREATED");
    }

    const now = new Date().toISOString();

    const held: CaptureNetState = {
      ...net,
      status: "holding",
      vectorCaptured: true,
      heldAt: now,
      updatedAt: now,

      parlourReady: false,
      parlourStateCreated: false,
      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.nets.set(captureNetId, held);

    return this.cloneState(held);
  }

  applyFilter(captureNetId: string): CaptureNetState {
    const net = this.nets.get(captureNetId);

    if (!net) {
      throw new Error("CAPTURE_NET_NOT_FOUND");
    }

    if (net.status !== "holding") {
      throw new Error("CAPTURE_NET_MUST_BE_HOLDING_BEFORE_FILTER");
    }

    const now = new Date().toISOString();

    const filtered: CaptureNetState = {
      ...net,
      status: "filtered",
      filterApplied: true,
      parlourReady: true,
      filteredAt: now,
      updatedAt: now,

      parlourStateCreated: false,
      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.nets.set(captureNetId, filtered);

    return this.cloneState(filtered);
  }

  releaseToParlour(captureNetId: string): CaptureNetState {
    const net = this.nets.get(captureNetId);

    if (!net) {
      throw new Error("CAPTURE_NET_NOT_FOUND");
    }

    if (net.status !== "filtered" || net.parlourReady !== true) {
      throw new Error("CAPTURE_NET_NOT_READY_FOR_PARLOUR");
    }

    const now = new Date().toISOString();

    const released: CaptureNetState = {
      ...net,
      status: "released",
      releasedAt: now,
      updatedAt: now,

      parlourStateCreated: false,
      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.nets.set(captureNetId, released);

    return this.cloneState(released);
  }

  blockCaptureNet(captureNetId: string): CaptureNetState {
    const net = this.nets.get(captureNetId);

    if (!net) {
      throw new Error("CAPTURE_NET_NOT_FOUND");
    }

    const now = new Date().toISOString();

    const blocked: CaptureNetState = {
      ...net,
      status: "blocked",
      parlourReady: false,
      updatedAt: now,

      parlourStateCreated: false,
      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.nets.set(captureNetId, blocked);

    return this.cloneState(blocked);
  }

  verifyCaptureNet(captureNetId: string): CaptureNetCheck {
    const net = this.nets.get(captureNetId);

    if (!net) {
      return {
        captureNetId,
        allowed: false,

        status: "blocked",
        identitySpineRef: "QR4TH_SPINE",
        level: "middle",
        functionRef: "capture_net_processing",

        routeVerified: false,
        vectorCaptured: false,
        filterApplied: false,
        parlourReady: false,

        reason: "CAPTURE_NET_NOT_FOUND",
        checkedAt: new Date().toISOString()
      };
    }

    if (net.identitySpineRef !== "QR4TH_SPINE") {
      return this.blockedCheck(net, "QR4TH_SPINE_REQUIRED");
    }

    if (net.routeVerified !== true) {
      return this.blockedCheck(net, "G6_ROUTE_NOT_VERIFIED");
    }

    if (net.vectorCaptured !== true) {
      return this.blockedCheck(net, "VECTOR_NOT_CAPTURED");
    }

    if (net.filterApplied !== true) {
      return this.blockedCheck(net, "CAPTURE_NET_FILTER_NOT_APPLIED");
    }

    if (net.parlourReady !== true) {
      return this.blockedCheck(net, "CAPTURE_NET_NOT_PARLOUR_READY");
    }

    if (net.status !== "filtered" && net.status !== "released") {
      return this.blockedCheck(net, "CAPTURE_NET_NOT_READY");
    }

    return {
      captureNetId: net.captureNetId,
      allowed: true,

      status: net.status,
      identitySpineRef: "QR4TH_SPINE",
      level: "middle",
      functionRef: "capture_net_processing",

      routeVerified: net.routeVerified,
      vectorCaptured: net.vectorCaptured,
      filterApplied: net.filterApplied,
      parlourReady: net.parlourReady,

      reason: "CAPTURE_NET_ALLOWED",
      checkedAt: new Date().toISOString()
    };
  }

  requestParlourTransition(captureNetId: string): HypogeumTransitionResult {
    const check = this.verifyCaptureNet(captureNetId);
    const net = this.nets.get(captureNetId);

    if (!check.allowed || !net) {
      return {
        transitionId: this.makeId("HYPOGEUM_CAPTURE_PARLOUR_TRANSITION_BLOCKED"),
        allowed: false,

        identitySpineRef: "QR4TH_SPINE",

        fromLevel: "middle",
        toLevel: "middle",
        functionRef: "parlour_state_machine",

        continuityHook: "lane_transition_lock",
        laneAuthorityRef: "capture_net",

        direction: "blocked",
        compressionApplied: false,
        turnstileRequired: true,
        turnstileAllowed: false,

        reason: check.reason,

        createdAt: new Date().toISOString()
      };
    }

    return {
      transitionId: this.makeId("HYPOGEUM_CAPTURE_PARLOUR_TRANSITION"),
      allowed: true,

      identitySpineRef: "QR4TH_SPINE",

      fromLevel: "middle",
      toLevel: "middle",
      functionRef: "parlour_state_machine",

      continuityHook: net.continuityHook,
      laneAuthorityRef: "capture_net",

      direction: "downward",
      compressionApplied: true,
      turnstileRequired: true,
      turnstileAllowed: true,

      reason: "HYPOGEUM_CAPTURE_TO_PARLOUR_ALLOWED",

      createdAt: new Date().toISOString()
    };
  }

  readCaptureNet(captureNetId: string): CaptureNetState | null {
    const net = this.nets.get(captureNetId);

    if (!net) return null;

    return this.cloneState(net);
  }

  listCaptureNets(): CaptureNetState[] {
    return Array.from(this.nets.values()).map((net) => this.cloneState(net));
  }

  fromG6RouteState(input: {
    route: G6VectorRouteState;
    filter: CaptureNetFilter;
    momentRef: string;
    continuityHook?: ContinuityHook;
    laneAuthorityRef?: LaneAuthorityRef;
  }): CaptureNetInput {
    if (input.route.status !== "routed") {
      throw new Error("G6_ROUTE_MUST_BE_ROUTED_FOR_CAPTURE_NET");
    }

    if (input.route.captureNetReady !== true) {
      throw new Error("G6_ROUTE_NOT_CAPTURE_NET_READY");
    }

    return {
      identitySpineRef: "QR4TH_SPINE",
      cyberQRId: input.route.cyberQRId,
      identityId: input.route.identityId,

      sessionId: input.route.sessionId,
      bloomId: input.route.bloomId,
      routeId: input.route.routeId,

      routeCheck: {
        routeId: input.route.routeId,
        allowed: true,
        status: input.route.status,
        identitySpineRef: "QR4TH_SPINE",
        level: "middle",
        functionRef: "g6_vector_routing",

        bloomVerified: input.route.bloomVerified,
        bloomCompressed: input.route.bloomCompressed,
        vectorLocked: input.route.vectorLocked,
        routeOpen: input.route.routeOpen,
        captureNetReady: input.route.captureNetReady,

        reason: "G6_ROUTE_STATE_ACCEPTED_FOR_CAPTURE_NET",
        checkedAt: new Date().toISOString()
      },

      vectorPath: input.route.vectorPath,
      filter: input.filter,

      continuityHook: input.continuityHook || "lane_transition_lock",
      laneAuthorityRef: input.laneAuthorityRef || "capture_net",
      momentRef: input.momentRef
    };
  }

  private assertInput(input: CaptureNetInput): void {
    if (!input) {
      throw new Error("CAPTURE_NET_INPUT_REQUIRED");
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

    if (!input.routeCheck) {
      throw new Error("G6_ROUTE_CHECK_REQUIRED");
    }

    if (!input.vectorPath) {
      throw new Error("G6_VECTOR_PATH_REQUIRED");
    }

    if (!input.filter) {
      throw new Error("CAPTURE_NET_FILTER_REQUIRED");
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

  private blockedCheck(net: CaptureNetState, reason: string): CaptureNetCheck {
    return {
      captureNetId: net.captureNetId,
      allowed: false,

      status: net.status,
      identitySpineRef: "QR4TH_SPINE",
      level: "middle",
      functionRef: "capture_net_processing",

      routeVerified: net.routeVerified,
      vectorCaptured: net.vectorCaptured,
      filterApplied: net.filterApplied,
      parlourReady: net.parlourReady,

      reason,
      checkedAt: new Date().toISOString()
    };
  }

  private cloneState(state: CaptureNetState): CaptureNetState {
    return {
      ...state,
      level: "middle",
      functionRef: "capture_net_processing",
      identitySpineRef: "QR4TH_SPINE",
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

export const CAPTURE_NET_PROCESSING_LEVEL: HypogeumLevelId = "middle";
export const CAPTURE_NET_PROCESSING_FUNCTION: HypogeumFunction = "capture_net_processing";
