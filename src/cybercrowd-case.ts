// src/cybercrowd-case.ts
//
// CyberCrowd Case Surface
//
// ONE JOB:
// Provide the internal CASE rail for CyberCrowd.
//
// CASE file.
// Not a NET file.
// Not an authority file.
// Not a Worker route.
//
// No discovery.
// No dynamic imports.
// No hidden state.
// No fake adapters.

export type CyberCrowdCaseState =
  | "new"
  | "held"
  | "active"
  | "stalled"
  | "resolved"
  | "released"
  | "sealed"
  | "burned"
  | "exited"
  | "analyzing";

export interface CyberCrowdCaseEvent {
  type: string;
  data: unknown;
  at: number;
}

export interface CyberCrowdCaseRecord {
  case_id: string;
  created_at: number;
  updated_at: number;
  state: CyberCrowdCaseState;
  context: Record<string, unknown>;
  events: CyberCrowdCaseEvent[];
}

export interface CyberCrowdCaseSnapshot {
  ok: boolean;
  active_case: string | null;
  cases: CyberCrowdCaseRecord[];
  total_cases: number;
  active: boolean;
  analyzing: boolean;
  exited: boolean;
}

class CyberCrowdCase {
  private cases: CyberCrowdCaseRecord[] = [];
  private activeCaseId: string | null = null;

  open(context: Record<string, unknown> = {}) {
    return this.createCase(context);
  }

  createCase(context: Record<string, unknown> = {}) {
    const case_id = crypto.randomUUID();
    const now = Date.now();

    const record: CyberCrowdCaseRecord = {
      case_id,
      created_at: now,
      updated_at: now,
      state: "new",
      context,
      events: []
    };

    this.cases.push(record);
    this.activeCaseId = case_id;

    return {
      ok: true,
      action: "cybercrowd_case_created",
      case_id,
      snapshot: this.snapshot()
    };
  }

  update(case_id: string, context: Record<string, unknown> = {}) {
    const record = this.findCase(case_id);

    if (!record) return this.notFound(case_id);

    record.context = {
      ...record.context,
      ...context
    };

    record.updated_at = Date.now();

    return {
      ok: true,
      action: "cybercrowd_case_updated",
      case_id,
      snapshot: this.snapshot()
    };
  }

  hold(case_id: string) {
    return this.setState(case_id, "held", "cybercrowd_case_held");
  }

  activate(case_id: string) {
    return this.enterCase(case_id);
  }

  enterCase(case_id: string) {
    const result = this.setState(case_id, "active", "cybercrowd_case_entered");

    if (result.ok) {
      this.activeCaseId = case_id;
    }

    return result;
  }

  stall(case_id: string) {
    return this.setState(case_id, "stalled", "cybercrowd_case_stalled");
  }

  resolve(case_id: string) {
    return this.setState(case_id, "resolved", "cybercrowd_case_resolved");
  }

  release(case_id: string) {
    return this.setState(case_id, "released", "cybercrowd_case_released");
  }

  seal(case_id: string) {
    return this.setState(case_id, "sealed", "cybercrowd_case_sealed");
  }

  burn(case_id: string) {
    return this.setState(case_id, "burned", "cybercrowd_case_burned");
  }

  exitCase(case_id: string) {
    const result = this.setState(case_id, "exited", "cybercrowd_case_exited");

    if (this.activeCaseId === case_id) {
      this.activeCaseId = null;
    }

    return result;
  }

  analyze(case_id: string) {
    return this.setState(case_id, "analyzing", "cybercrowd_case_analyzing");
  }

  pushEvent(case_id: string, type: string, data: unknown) {
    const record = this.findCase(case_id);

    if (!record) return this.notFound(case_id);

    record.events.push({
      type,
      data,
      at: Date.now()
    });

    record.updated_at = Date.now();

    return {
      ok: true,
      action: "cybercrowd_case_event_pushed",
      case_id,
      snapshot: this.snapshot()
    };
  }

  get(case_id: string) {
    const record = this.findCase(case_id);

    if (!record) return this.notFound(case_id);

    return {
      ok: true,
      action: "cybercrowd_case_get",
      case: { ...record }
    };
  }

  snapshot(): CyberCrowdCaseSnapshot {
    const activeRecord = this.activeCaseId
      ? this.findCase(this.activeCaseId)
      : null;

    return {
      ok: true,
      active_case: this.activeCaseId,
      cases: this.cases.map((record) => ({
        ...record,
        events: [...record.events],
        context: { ...record.context }
      })),
      total_cases: this.cases.length,
      active: this.activeCaseId !== null,
      analyzing: activeRecord?.state === "analyzing",
      exited: activeRecord?.state === "exited"
    };
  }

  reset() {
    this.cases = [];
    this.activeCaseId = null;

    return {
      ok: true,
      action: "cybercrowd_case_reset",
      snapshot: this.snapshot()
    };
  }

  private setState(
    case_id: string,
    state: CyberCrowdCaseState,
    action: string
  ) {
    const record = this.findCase(case_id);

    if (!record) return this.notFound(case_id);

    record.state = state;
    record.updated_at = Date.now();

    return {
      ok: true,
      action,
      case_id,
      snapshot: this.snapshot()
    };
  }

  private findCase(case_id: string) {
    return this.cases.find((record) => record.case_id === case_id) ?? null;
  }

  private notFound(case_id: string) {
    return {
      ok: false,
      error: "CASE_NOT_FOUND",
      case_id,
      snapshot: this.snapshot()
    };
  }
}

export const CyberCrowdCaseSurface = new CyberCrowdCase();
