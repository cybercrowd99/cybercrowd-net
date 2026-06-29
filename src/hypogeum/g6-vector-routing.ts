/**
 * src/hypogeum/g6-vector-routing.ts
 *
 * CyberCrowd Hypogeum — G6VectorRouting
 *
 * ONE JOB:
 * Route a compressed Bloom state into a middle-level G6 vector path.
 *
 * This is NOT BloomLogic.
 * This is NOT CaptureNet processing.
 * This is NOT Parlour state.
 * This is NOT lower-level Sponge.
 * This is NOT payment.
 * This is NOT deletion.
 * This is NOT QR generation.
 * This is NOT scanning.
 *
 * G6VectorRouting says:
 * the compressed bloom can move through one controlled vector path.
 */

import type {
  ContinuityHook,
  HypogeumFunction,
  HypogeumLevelId,
  HypogeumTransitionResult,
  LaneAuthorityRef
} from "./hypogeum-kernel";

import type {
  BloomCheck,
  BloomState
} from "./bloom-logic";

export type G6VectorRouteStatus =
  | "created"
  | "routed"
  | "blocked"
  | "closed";

export type G6VectorPath =
  | "identity_vector"
  | "creator_vector"
  | "crowd_vector"
  | "moment_vector"
  | "presence_vector"
  | "other";

export interface G6VectorRouteInput {
  routeId?: string;

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;

  sessionId: string;
  bloomId: string;
  bloomCheck: BloomCheck;

  vectorPath: G6VectorPath;
  continuityHook: ContinuityHook;
  laneAuthorityRef: LaneAuthorityRef;
  momentRef: string;
}

export interface G6VectorRouteState {
  routeId: string;

  level: "middle";
  functionRef: "g6_vector_routing";

  identitySpineRef: "QR4TH_SPINE";
  cyberQRId: string;
  identityId: string;

  sessionId: string;
  bloomId: string;

  vectorPath: G6VectorPath;
  continuityHook: ContinuityHook;
  laneAuthorityRef: LaneAuthorityRef;
  momentRef: string;

  status: G6VectorRouteStatus;

  bloomVerified: boolean;
  bloomCompressed: boolean;
  vectorLocked: boolean;
  routeOpen: boolean;

  captureNetReady: boolean;
  captureNetCreated: false;
  parlourStateCreated: false;
  lowerLevelAccess: false;

  paymentCreated: false;
  qrGenerated: false;
  deletionCreated: false;
  scanCreated: false;

  createdAt: string;
  routedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
}

export interface G6VectorRouteCheck {
  routeId: string;
  allowed: boolean;

  status: G6VectorRouteStatus;
  identitySpineRef: "QR4TH_SPINE";
  level: "middle";
  functionRef: "g6_vector_routing";

  bloomVerified: boolean;
  bloomCompressed: boolean;
  vectorLocked: boolean;
  routeOpen: boolean;
  captureNetReady: boolean;

  reason: string;
  checkedAt: string;
}

export class G6VectorRouting {
  private routes: Map<string, G6VectorRouteState>;

  constructor() {
    this.routes = new Map();
  }

  createRoute(input: G6VectorRouteInput): G6VectorRouteState {
    this.assertInput(input);

    if (!input.bloomCheck.allowed) {
      throw new Error("G6_ROUTE_REQUIRES_VERIFIED_BLOOM");
    }

    if (input.bloomCheck.status !== "compressed") {
      throw new Error("G6_ROUTE_REQUIRES_COMPRESSED_BLOOM");
    }

    const now = new Date().toISOString();
    const routeId = input.routeId || this.makeId("HYPOGEUM_G6_ROUTE");

    const state: G6VectorRouteState = {
      routeId,

      level: "middle",
      functionRef: "g6_vector_routing",

      identitySpineRef: input.identitySpineRef,
      cyberQRId: input.cyberQRId,
      identityId: input.identityId,

      sessionId: input.sessionId,
      bloomId: input.bloomId,

      vectorPath: input.vectorPath,
      continuityHook: input.continuityHook,
      laneAuthorityRef: input.laneAuthorityRef,
      momentRef: input.momentRef,

      status: "created",

      bloomVerified: true,
      bloomCompressed: true,
      vectorLocked: true,
      routeOpen: false,

      captureNetReady: false,
      captureNetCreated: false,
      parlourStateCreated: false,
      lowerLevelAccess: false,

      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false,

      createdAt: now,
      routedAt: null,
      closedAt: null,
      updatedAt: now
    };

    this.routes.set(routeId, state);

    return this.cloneState(state);
  }

  openRoute(routeId: string): G6VectorRouteState {
    const route = this.routes.get(routeId);

    if (!route) {
      throw new Error("G6_ROUTE_NOT_FOUND");
    }

    if (route.status !== "created") {
      throw new Error("G6_ROUTE_NOT_CREATED");
    }

    const now = new Date().toISOString();

    const routed: G6VectorRouteState = {
      ...route,
      status: "routed",
      routeOpen: true,
      captureNetReady: true,
      routedAt: now,
      updatedAt: now,

      captureNetCreated: false,
      parlourStateCreated: false,
      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.routes.set(routeId, routed);

    return this.cloneState(routed);
  }

  closeRoute(routeId: string): G6VectorRouteState {
    const route = this.routes.get(routeId);

    if (!route) {
      throw new Error("G6_ROUTE_NOT_FOUND");
    }

    const now = new Date().toISOString();

    const closed: G6VectorRouteState = {
      ...route,
      status: "closed",
      routeOpen: false,
      captureNetReady: false,
      closedAt: now,
      updatedAt: now,

      captureNetCreated: false,
      parlourStateCreated: false,
      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.routes.set(routeId, closed);

    return this.cloneState(closed);
  }

  blockRoute(routeId: string): G6VectorRouteState {
    const route = this.routes.get(routeId);

    if (!route) {
      throw new Error("G6_ROUTE_NOT_FOUND");
    }

    const now = new Date().toISOString();

    const blocked: G6VectorRouteState = {
      ...route,
      status: "blocked",
      routeOpen: false,
      captureNetReady: false,
      updatedAt: now,

      captureNetCreated: false,
      parlourStateCreated: false,
      lowerLevelAccess: false,
      paymentCreated: false,
      qrGenerated: false,
      deletionCreated: false,
      scanCreated: false
    };

    this.routes.set(routeId, blocked);

    return this.cloneState(blocked);
  }

  verifyRoute(routeId: string): G6VectorRouteCheck {
    const route = this.routes.get(routeId);

    if (!route) {
      return {
        routeId,
        allowed: false,

        status: "blocked",
        identitySpineRef: "QR4TH_SPINE",
        level: "middle",
        functionRef: "g6_vector_routing",

        bloomVerified: false,
        bloomCompressed: false,
        vectorLocked: false,
        routeOpen: false,
        captureNetReady: false,

        reason: "G6_ROUTE_NOT_FOUND",
        checkedAt: new Date().toISOString()
      };
    }

    if (route.identitySpineRef !== "QR4TH_SPINE") {
      return this.blockedCheck(route, "QR4TH_SPINE_REQUIRED");
    }

    if (route.bloomVerified !== true) {
      return this.blockedCheck(route, "BLOOM_NOT_VERIFIED");
    }

    if (route.bloomCompressed !== true) {
      return this.blockedCheck(route, "BLOOM_NOT_COMPRESSED");
    }

    if (route.vectorLocked !== true) {
      return this.blockedCheck(route, "G6_VECTOR_NOT_LOCKED");
    }

    if (route.status !== "routed") {
      return this.blockedCheck(route, "G6_ROUTE_NOT_OPEN");
    }

    if (route.routeOpen !== true || route.captureNetReady !== true) {
      return this.blockedCheck(route, "G6_ROUTE_NOT_READY_FOR_CAPTURE_NET");
    }

    return {
      routeId: route.routeId,
      allowed: true,

      status: route.status,
      identitySpineRef: "QR4TH_SPINE",
      level: "middle",
      functionRef: "g6_vector_routing",

      bloomVerified: route.bloomVerified,
      bloomCompressed: route.bloomCompressed,
      vectorLocked: route.vectorLocked,
      routeOpen: route.routeOpen,
      captureNetReady: route.captureNetReady,

      reason: "G6_ROUTE_ALLOWED",
      checkedAt: new Date().toISOString()
    };
  }

  requestCaptureNetTransition(routeId: string): HypogeumTransitionResult {
    const check = this.verifyRoute(routeId);
    const route = this.routes.get(routeId);

    if (!check.allowed || !route) {
      return {
        transitionId: this.makeId("HYPOGEUM_G6_CAPTURE_TRANSITION_BLOCKED"),
        allowed: false,

        identitySpineRef: "QR4TH_SPINE",

        fromLevel: "middle",
        toLevel: "middle",
        functionRef: "capture_net_processing",

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
      transitionId: this.makeId("HYPOGEUM_G6_CAPTURE_TRANSITION"),
      allowed: true,

      identitySpineRef: "QR4TH_SPINE",

      fromLevel: "middle",
      toLevel: "middle",
      functionRef: "capture_net_processing",

      continuityHook: route.continuityHook,
      laneAuthorityRef: "capture_net",

      direction: "downward",
      compressionApplied: true,
      turnstileRequired: true,
      turnstileAllowed: true,

      reason: "HYPOGEUM_G6_TO_CAPTURE_NET_ALLOWED",

      createdAt: new Date().toISOString()
    };
  }

  readRoute(routeId: string): G6VectorRouteState | null {
    const route = this.routes.get(routeId);

    if (!route) return null;

    return this.cloneState(route);
  }

  listRoutes(): G6VectorRouteState[] {
    return Array.from(this.routes.values()).map((route) => this.cloneState(route));
  }

  fromBloomState(input: {
    bloom: BloomState;
    vectorPath: G6VectorPath;
    momentRef: string;
    laneAuthorityRef?: LaneAuthorityRef;
    continuityHook?: ContinuityHook;
  }): G6VectorRouteInput {
    if (input.bloom.status !== "compressed") {
      throw new Error("BLOOM_MUST_BE_COMPRESSED_FOR_G6_ROUTE");
    }

    return {
      identitySpineRef: "QR4TH_SPINE",
      cyberQRId: input.bloom.cyberQRId,
      identityId: input.bloom.identityId,
      sessionId: input.bloom.sessionId,
      bloomId: input.bloom.bloomId,

      bloomCheck: {
        bloomId: input.bloom.bloomId,
        allowed: true,
        status: input.bloom.status,
        identitySpineRef: "QR4TH_SPINE",
        level: "middle",
        functionRef: "bloom_logic",
        upperSessionVerified: input.bloom.upperSessionVerified,
        compressionApplied: input.bloom.compressionApplied,
        resonanceOpen: input.bloom.resonanceOpen,
        reason: "BLOOM_STATE_ACCEPTED_FOR_G6_ROUTE",
        checkedAt: new Date().toISOString()
      },

      vectorPath: input.vectorPath,
      continuityHook: input.continuityHook || "lane_transition_lock",
      laneAuthorityRef: input.laneAuthorityRef || "bloom",
      momentRef: input.momentRef
    };
  }

  private assertInput(input: G6VectorRouteInput): void {
    if (!input) {
      throw new Error("G6_ROUTE_INPUT_REQUIRED");
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

    if (!input.bloomCheck) {
      throw new Error("BLOOM_CHECK_REQUIRED");
    }

    if (!input.vectorPath) {
      throw new Error("G6_VECTOR_PATH_REQUIRED");
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

  private blockedCheck(route: G6VectorRouteState, reason: string): G6VectorRouteCheck {
    return {
      routeId: route.routeId,
      allowed: false,

      status: route.status,
      identitySpineRef: "QR4TH_SPINE",
      level: "middle",
      functionRef: "g6_vector_routing",

      bloomVerified: route.bloomVerified,
      bloomCompressed: route.bloomCompressed,
      vectorLocked: route.vectorLocked,
      routeOpen: route.routeOpen,
      captureNetReady: route.captureNetReady,

      reason,
      checkedAt: new Date().toISOString()
    };
  }

  private cloneState(state: G6VectorRouteState): G6VectorRouteState {
    return {
      ...state,
      level: "middle",
      functionRef: "g6_vector_routing",
      identitySpineRef: "QR4TH_SPINE",
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

export const G6_VECTOR_ROUTING_LEVEL: HypogeumLevelId = "middle";
export const G6_VECTOR_ROUTING_FUNCTION: HypogeumFunction = "g6_vector_routing";
