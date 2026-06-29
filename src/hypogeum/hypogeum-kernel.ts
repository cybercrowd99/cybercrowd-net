/**
 * src/hypogeum/hypogeum-kernel.ts
 *
 * CyberCrowd Hypogeum Kernel
 *
 * ONE JOB:
 * Model the three-level negative-architecture backend beneath the Arena.
 *
 * This is NOT a public page.
 * This is NOT QR generation.
 * This is NOT payment.
 * This is NOT deletion.
 * This is NOT a scanner.
 * This is NOT lane access by itself.
 *
 * Hypogeum says:
 * state moves downward through carved backend levels,
 * bound to QR4th, TurnstileStorage, ContinuityEngine, and lane authority.
 */

export type HypogeumLevelId =
  | "upper"
  | "middle"
  | "lower";

export type HypogeumFunction =
  | "session_engine"
  | "identity_state"
  | "creator_state"
  | "crowd_state"
  | "bloom_logic"
  | "g6_vector_routing"
  | "capture_net_processing"
  | "parlour_state_machine"
  | "sponge_layer"
  | "emotional_resonance"
  | "decompression_chambers"
  | "deep_state_buffers";

export type ContinuityHook =
  | "identity_state_sync"
  | "moment_continuity"
  | "lane_transition_lock";

export type LaneAuthorityRef =
  | "session"
  | "bloom"
  | "capture_net"
  | "deep_state";

export type SpongeProtocol =
  | "absorb"
  | "buffer"
  | "release";

export type RitualAlignmentLogic =
  | "state_sync"
  | "moment_lock"
  | "presence_resonance";

export interface HypogeumLevel {
  levelId: HypogeumLevelId;
  functions: HypogeumFunction[];
  turnstileEntry: boolean;
}

export interface HypogeumEnergyFlow {
  direction: "downward";
  compression: true;
  resonanceNodes: 9;
}

export interface HypogeumProperties {
  negativeArchitecture: true;
  resonanceOptimized: true;
  labyrinthFlow: true;
  ritualAlignment: true;
  energyControl: true;
}

export interface HypogeumState {
  hypogeumId: string;

  layer: "hypogeum";
  purpose: "negative-architecture backend";
  inspiredBy: "Hal Saflieni Hypogeum";

  levels: {
    upper: HypogeumLevel;
    middle: HypogeumLevel;
    lower: HypogeumLevel;
  };

  qr4thBinding: true;
  identitySpineRef: "QR4TH_SPINE";

  continuityHooks: ContinuityHook[];
  laneAuthority: LaneAuthorityRef[];

  energyFlow: HypogeumEnergyFlow;

  spongeProtocols: SpongeProtocol[];
  ritualAlignmentLogic: RitualAlignmentLogic[];

  properties: HypogeumProperties;

  description: string;

  createdAt: string;
  updatedAt: string;
}

export interface HypogeumTransitionRequest {
  identitySpineRef: "QR4TH_SPINE";
  fromLevel: HypogeumLevelId;
  toLevel: HypogeumLevelId;
  functionRef: HypogeumFunction;
  continuityHook: ContinuityHook;
  laneAuthorityRef: LaneAuthorityRef;
}

export interface HypogeumTransitionResult {
  transitionId: string;
  allowed: boolean;

  identitySpineRef: "QR4TH_SPINE";

  fromLevel: HypogeumLevelId;
  toLevel: HypogeumLevelId;
  functionRef: HypogeumFunction;

  continuityHook: ContinuityHook;
  laneAuthorityRef: LaneAuthorityRef;

  direction: "downward" | "blocked";
  compressionApplied: boolean;
  turnstileRequired: boolean;
  turnstileAllowed: boolean;

  reason: string;

  createdAt: string;
}

export class HypogeumKernel {
  private state: HypogeumState;

  constructor(hypogeumId: string = "CYBERCROWD_HYPOGEUM") {
    const now = new Date().toISOString();

    this.state = {
      hypogeumId,

      layer: "hypogeum",
      purpose: "negative-architecture backend",
      inspiredBy: "Hal Saflieni Hypogeum",

      levels: {
        upper: {
          levelId: "upper",
          functions: [
            "session_engine",
            "identity_state",
            "creator_state",
            "crowd_state"
          ],
          turnstileEntry: true
        },

        middle: {
          levelId: "middle",
          functions: [
            "bloom_logic",
            "g6_vector_routing",
            "capture_net_processing",
            "parlour_state_machine"
          ],
          turnstileEntry: true
        },

        lower: {
          levelId: "lower",
          functions: [
            "sponge_layer",
            "emotional_resonance",
            "decompression_chambers",
            "deep_state_buffers"
          ],
          turnstileEntry: false
        }
      },

      qr4thBinding: true,
      identitySpineRef: "QR4TH_SPINE",

      continuityHooks: [
        "identity_state_sync",
        "moment_continuity",
        "lane_transition_lock"
      ],

      laneAuthority: [
        "session",
        "bloom",
        "capture_net",
        "deep_state"
      ],

      energyFlow: {
        direction: "downward",
        compression: true,
        resonanceNodes: 9
      },

      spongeProtocols: [
        "absorb",
        "buffer",
        "release"
      ],

      ritualAlignmentLogic: [
        "state_sync",
        "moment_lock",
        "presence_resonance"
      ],

      properties: {
        negativeArchitecture: true,
        resonanceOptimized: true,
        labyrinthFlow: true,
        ritualAlignment: true,
        energyControl: true
      },

      description:
        "The CyberCrowd Hypogeum is a three-level negative-architecture backend inspired by the Hal Saflieni Hypogeum. It binds directly to QR4th, TurnstileStorage, and the Continuity Engine. It contains session logic, Bloom systems, G6 routing, Capture Nets, and the emotional Sponge Layer. It is carved downward, not built upward, forming the resonant machinery beneath the Arena.",

      createdAt: now,
      updatedAt: now
    };
  }

  readState(): HypogeumState {
    return {
      ...this.state,
      levels: {
        upper: { ...this.state.levels.upper },
        middle: { ...this.state.levels.middle },
        lower: { ...this.state.levels.lower }
      },
      continuityHooks: [...this.state.continuityHooks],
      laneAuthority: [...this.state.laneAuthority],
      spongeProtocols: [...this.state.spongeProtocols],
      ritualAlignmentLogic: [...this.state.ritualAlignmentLogic],
      energyFlow: { ...this.state.energyFlow },
      properties: { ...this.state.properties }
    };
  }

  getLevel(levelId: HypogeumLevelId): HypogeumLevel {
    return {
      ...this.state.levels[levelId]
    };
  }

  canUseFunction(levelId: HypogeumLevelId, functionRef: HypogeumFunction): boolean {
    return this.state.levels[levelId].functions.includes(functionRef);
  }

  requestTransition(request: HypogeumTransitionRequest): HypogeumTransitionResult {
    const now = new Date().toISOString();

    if (request.identitySpineRef !== this.state.identitySpineRef) {
      return this.blockTransition(request, "QR4TH_SPINE_MISMATCH");
    }

    if (!this.isValidDownwardTransition(request.fromLevel, request.toLevel)) {
      return this.blockTransition(request, "HYPOGEUM_ONLY_MOVES_DOWNWARD");
    }

    if (!this.canUseFunction(request.toLevel, request.functionRef)) {
      return this.blockTransition(request, "FUNCTION_NOT_IN_TARGET_LEVEL");
    }

    if (!this.state.continuityHooks.includes(request.continuityHook)) {
      return this.blockTransition(request, "CONTINUITY_HOOK_NOT_RECOGNIZED");
    }

    if (!this.state.laneAuthority.includes(request.laneAuthorityRef)) {
      return this.blockTransition(request, "LANE_AUTHORITY_NOT_RECOGNIZED");
    }

    const targetLevel = this.state.levels[request.toLevel];

    return {
      transitionId: this.makeId("HYPOGEUM_TRANSITION"),
      allowed: true,

      identitySpineRef: request.identitySpineRef,

      fromLevel: request.fromLevel,
      toLevel: request.toLevel,
      functionRef: request.functionRef,

      continuityHook: request.continuityHook,
      laneAuthorityRef: request.laneAuthorityRef,

      direction: "downward",
      compressionApplied: true,
      turnstileRequired: targetLevel.turnstileEntry,
      turnstileAllowed: targetLevel.turnstileEntry,

      reason: "HYPOGEUM_TRANSITION_ALLOWED",

      createdAt: now
    };
  }

  applySpongeProtocol(protocol: SpongeProtocol): {
    protocol: SpongeProtocol;
    allowed: boolean;
    lowerLevelOnly: true;
    createdAt: string;
  } {
    if (!this.state.spongeProtocols.includes(protocol)) {
      throw new Error("SPONGE_PROTOCOL_NOT_RECOGNIZED");
    }

    return {
      protocol,
      allowed: true,
      lowerLevelOnly: true,
      createdAt: new Date().toISOString()
    };
  }

  verifyRitualAlignment(logic: RitualAlignmentLogic): {
    logic: RitualAlignmentLogic;
    aligned: boolean;
    identitySpineRef: "QR4TH_SPINE";
    createdAt: string;
  } {
    if (!this.state.ritualAlignmentLogic.includes(logic)) {
      return {
        logic,
        aligned: false,
        identitySpineRef: this.state.identitySpineRef,
        createdAt: new Date().toISOString()
      };
    }

    return {
      logic,
      aligned: true,
      identitySpineRef: this.state.identitySpineRef,
      createdAt: new Date().toISOString()
    };
  }

  private blockTransition(
    request: HypogeumTransitionRequest,
    reason: string
  ): HypogeumTransitionResult {
    return {
      transitionId: this.makeId("HYPOGEUM_TRANSITION_BLOCKED"),
      allowed: false,

      identitySpineRef: request.identitySpineRef,

      fromLevel: request.fromLevel,
      toLevel: request.toLevel,
      functionRef: request.functionRef,

      continuityHook: request.continuityHook,
      laneAuthorityRef: request.laneAuthorityRef,

      direction: "blocked",
      compressionApplied: false,
      turnstileRequired: false,
      turnstileAllowed: false,

      reason,

      createdAt: new Date().toISOString()
    };
  }

  private isValidDownwardTransition(
    fromLevel: HypogeumLevelId,
    toLevel: HypogeumLevelId
  ): boolean {
    const order: Record<HypogeumLevelId, number> = {
      upper: 1,
      middle: 2,
      lower: 3
    };

    return order[toLevel] >= order[fromLevel];
  }

  private makeId(prefix: string): string {
    if (crypto && crypto.randomUUID) {
      return `${prefix}.${crypto.randomUUID()}`;
    }

    return `${prefix}.${Date.now()}.${Math.random().toString(36).slice(2, 10)}`;
  }
}
