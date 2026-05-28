// sovereign/crown-signal-emission-engine.ts

import { CrownLayer } from "./crown-layer";
import { CAPTURE_NET_SOVEREIGN_INTEGRATION } from "../capture-net/capture-net-sovereign-integration-manifest";
import { CDC_INTEGRATION_CHANNELS } from "./cdc-integration-layer";
import { WDIG_BINDINGS } from "./wdig-binding-layer";
import { CIVIC_ROUTES } from "../civic/civic-transparency-dashboard";

export interface CrownSignal {
  id: string;
  target: string;
  payload: any;
  timestamp: string;
}

export interface CrownSignalOutput {
  signals: CrownSignal[];
  timestamp: string;
}

export class CrownSignalEmissionEngine {
  private crown = new CrownLayer();

  emit(): CrownSignalOutput {
    const timestamp = new Date().toISOString();
    const adjudication = this.crown.adjudicate();

    const sovereignTargets = CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.map(
      (c) => c.id
    );
    const cdcTargets = CDC_INTEGRATION_CHANNELS.map((c) => c.id);
    const wdigTargets = WDIG_BINDINGS.map((b) => b.id);
    const civicTargets = CIVIC_ROUTES.map((r) => r.id);

    const allTargets = [
      ...sovereignTargets,
      ...cdcTargets,
      ...wdigTargets,
      ...civicTargets
    ];

    const signals: CrownSignal[] = allTargets.map((t) => ({
      id: `crown.signal.${t}`,
      target: t,
      payload: adjudication.directives,
      timestamp
    }));

    return {
      signals,
      timestamp
    };
  }
}
