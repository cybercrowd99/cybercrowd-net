// src/cybercrowd-net.ts
//
// CyberCrowd Net
//
// ONE JOB:
// Provide the top CyberCrowd-net entry point without swallowing core logic.
//
// Net exposes.
// Core owns logic.
// Worker runs routes.
// Auth owns entry.

export type CyberCrowdNetStatus =
  | "idle"
  | "ready"
  | "bootstrapped"
  | "initialized"
  | "active"
  | "error";

export interface CyberCrowdNetState {
  name: "cybercrowd-net";
  status: CyberCrowdNetStatus;
  created_at_ms: number;
  updated_at_ms: number;
}

export interface CyberCrowdNetResult {
  ok: boolean;
  state: CyberCrowdNetState;
  message: string;
}

export class CyberCrowdNet {
  private state: CyberCrowdNetState = {
    name: "cybercrowd-net",
    status: "idle",
    created_at_ms: Date.now(),
    updated_at_ms: Date.now()
  };

  ready(): CyberCrowdNetResult {
    this.state = {
      ...this.state,
      status: "ready",
      updated_at_ms: Date.now()
    };

    return this.result("CyberCrowd-net ready.");
  }

  bootstrap(): CyberCrowdNetResult {
    this.state = {
      ...this.state,
      status: "bootstrapped",
      updated_at_ms: Date.now()
    };

    return this.result("CyberCrowd-net bootstrapped.");
  }

  init(): CyberCrowdNetResult {
    this.state = {
      ...this.state,
      status: "initialized",
      updated_at_ms: Date.now()
    };

    return this.result("CyberCrowd-net initialized.");
  }

  activate(): CyberCrowdNetResult {
    this.state = {
      ...this.state,
      status: "active",
      updated_at_ms: Date.now()
    };

    return this.result("CyberCrowd-net active.");
  }

  fail(message = "CyberCrowd-net error."): CyberCrowdNetResult {
    this.state = {
      ...this.state,
      status: "error",
      updated_at_ms: Date.now()
    };

    return this.result(message, false);
  }

  getState(): CyberCrowdNetState {
    return { ...this.state };
  }

  private result(message: string, ok = true): CyberCrowdNetResult {
    return {
      ok,
      state: this.getState(),
      message
    };
  }
}

export const CyberCrowdNetSurface = new CyberCrowdNet();
