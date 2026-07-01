// src/cybercrowd-net-binding-chain.ts
//
// CyberCrowd Net Binding Chain
//
// ONE JOB:
// Define the ordered binding sequence for CyberCrowd-net.
//
// Internal file.
// Not a Worker route.
// Not a public outside surface.
//
// No fake imports.
// No mystery state files.
// No hidden discovery.

export type CyberCrowdNetBindingName =
  | "project-envelope"
  | "sync-manager"
  | "case"
  | "case-exit"
  | "case-analysis"
  | "lanternfish-archive"
  | "decchamber-black-box"
  | "flight-control"
  | "case-health";

export interface CyberCrowdNetBindingAdapter {
  binding_name: CyberCrowdNetBindingName;
  binding_label: string;
  can_bind: boolean;
  exposes: string[];
  requires: CyberCrowdNetBindingName[];
  bind?: () => unknown;
  data?: Record<string, unknown>;
}

export interface CyberCrowdNetBindingRecord {
  binding_name: CyberCrowdNetBindingName;
  binding_label: string;
  can_bind: boolean;
  bound: boolean;
  blocked: boolean;
  waiting: boolean;
  exposes: string[];
  requires: CyberCrowdNetBindingName[];
  data: Record<string, unknown>;
}

export interface CyberCrowdNetBindingSnapshot {
  state: "idle" | "binding" | "stable" | "blocked" | "reset";
  bindings: CyberCrowdNetBindingRecord[];
  bound: CyberCrowdNetBindingName[];
  blocked: CyberCrowdNetBindingName[];
  waiting: CyberCrowdNetBindingName[];
  context: Record<string, unknown>;
  chain_complete: boolean;
  stable: boolean;
}

const LOCKED_BINDING_ORDER: CyberCrowdNetBindingName[] = [
  "project-envelope",
  "sync-manager",
  "case",
  "case-exit",
  "case-analysis",
  "lanternfish-archive",
  "decchamber-black-box",
  "flight-control",
  "case-health"
];

class CyberCrowdNetBindingChain {
  private state: CyberCrowdNetBindingSnapshot = this.makeResetSnapshot();

  bindChain(adapters: CyberCrowdNetBindingAdapter[]) {
    this.state = {
      ...this.makeResetSnapshot(),
      state: "binding"
    };

    const adapterMap = new Map<CyberCrowdNetBindingName, CyberCrowdNetBindingAdapter>();

    for (const adapter of adapters) {
      adapterMap.set(adapter.binding_name, adapter);
    }

    for (const bindingName of LOCKED_BINDING_ORDER) {
      const adapter = adapterMap.get(bindingName);

      if (!adapter) {
        this.pushRecord({
          binding_name: bindingName,
          binding_label: bindingName,
          can_bind: false,
          bound: false,
          blocked: true,
          waiting: false,
          exposes: [],
          requires: [],
          data: {
            error: "ADAPTER_MISSING"
          }
        });

        continue;
      }

      const missingRequires = adapter.requires.filter(
        (required) => !this.state.bound.includes(required)
      );

      if (!adapter.can_bind || missingRequires.length > 0) {
        this.pushRecord({
          binding_name: adapter.binding_name,
          binding_label: adapter.binding_label,
          can_bind: adapter.can_bind,
          bound: false,
          blocked: !adapter.can_bind,
          waiting: missingRequires.length > 0,
          exposes: adapter.exposes,
          requires: adapter.requires,
          data: {
            ...(adapter.data ?? {}),
            missing_requires: missingRequires
          }
        });

        continue;
      }

      const output = adapter.bind ? adapter.bind() : null;

      this.pushRecord({
        binding_name: adapter.binding_name,
        binding_label: adapter.binding_label,
        can_bind: true,
        bound: true,
        blocked: false,
        waiting: false,
        exposes: adapter.exposes,
        requires: adapter.requires,
        data: {
          ...(adapter.data ?? {}),
          output_type: typeof output
        }
      });
    }

    const snapshot = this.snapshot();

    this.state = {
      ...snapshot,
      state: snapshot.blocked.length > 0 || snapshot.waiting.length > 0 ? "blocked" : "stable"
    };

    return {
      ok: this.state.stable,
      error: this.state.stable ? null : "NET_BINDING_CHAIN_INCOMPLETE",
      state: this.state.state,
      bindings: this.state.bindings,
      bound: this.state.bound,
      blocked: this.state.blocked,
      waiting: this.state.waiting
    };
  }

  reset() {
    this.state = this.makeResetSnapshot();

    return {
      ok: true,
      action: "cybercrowd_net_binding_chain_reset",
      snapshot: this.snapshot()
    };
  }

  snapshot(): CyberCrowdNetBindingSnapshot {
    const bound = this.state.bindings
      .filter((binding) => binding.bound)
      .map((binding) => binding.binding_name);

    const blocked = this.state.bindings
      .filter((binding) => binding.blocked)
      .map((binding) => binding.binding_name);

    const waiting = this.state.bindings
      .filter((binding) => binding.waiting)
      .map((binding) => binding.binding_name);

    const chainComplete = LOCKED_BINDING_ORDER.every((bindingName) =>
      bound.includes(bindingName)
    );

    return {
      state: this.state.state,
      bindings: [...this.state.bindings],
      bound,
      blocked,
      waiting,
      context: {
        locked_order: [...LOCKED_BINDING_ORDER],
        total_required: LOCKED_BINDING_ORDER.length,
        total_bound: bound.length,
        total_blocked: blocked.length,
        total_waiting: waiting.length
      },
      chain_complete: chainComplete,
      stable: chainComplete && blocked.length === 0 && waiting.length === 0
    };
  }

  private pushRecord(record: CyberCrowdNetBindingRecord) {
    this.state.bindings.push(record);
  }

  private makeResetSnapshot(): CyberCrowdNetBindingSnapshot {
    return {
      state: "reset",
      bindings: [],
      bound: [],
      blocked: [],
      waiting: [],
      context: {
        locked_order: [...LOCKED_BINDING_ORDER],
        total_required: LOCKED_BINDING_ORDER.length,
        total_bound: 0,
        total_blocked: 0,
        total_waiting: 0
      },
      chain_complete: false,
      stable: false
    };
  }
}

export const CyberCrowdNetBindingChainSurface = new CyberCrowdNetBindingChain();
