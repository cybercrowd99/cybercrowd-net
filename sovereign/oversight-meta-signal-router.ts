// sovereign/oversight-meta-signal-router.ts

import { CAPTURE_NET_SOVEREIGN_INTEGRATION } from "../capture-net/capture-net-sovereign-integration-manifest";
import { SovereignPatternCompiler } from "./sovereign-pattern-compiler";
import { WDIG_BINDINGS } from "./wdig-binding-layer";
import { CDC_INTEGRATION_CHANNELS } from "./cdc-integration-layer";
import { CIVIC_ROUTES } from "../civic/civic-transparency-dashboard";

export interface MetaSignalRoute {
  id: string;
  target: string;
  payload: any;
  timestamp: string;
}

export class OversightMetaSignalRouter {
  private compiler = new SovereignPatternCompiler();

  private getOversight() {
    return CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.find(
      (c) => c.id === "oversight.global"
    );
  }

  private getMetaSignals() {
    return CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.find(
      (c) => c.id === "meta.signals"
    );
  }

  route(): MetaSignalRoute[] {
    const timestamp = new Date().toISOString();

    const oversight = this.getOversight();
    const metas = this.getMetaSignals();
    const pattern = this.compiler.compile();

    const sovereignTargets = ["sovereign.governance", "sovereign.harmonics"];
    const cdcTargets = CDC_INTEGRATION_CHANNELS.map((c) => c.id);
    const wdigTargets = WDIG_BINDINGS.map((b) => b.id);
    const civicTargets = CIVIC_ROUTES.map((r) => r.id);

    const routes: MetaSignalRoute[] = [];

    sovereignTargets.forEach((t) =>
      routes.push({
        id: `route.sovereign.${t}`,
        target: t,
        payload: { oversight, metas, pattern },
        timestamp
      })
    );

    cdcTargets.forEach((t) =>
      routes.push({
        id: `route.cdc.${t}`,
        target: t,
        payload: { metas, pattern },
        timestamp
      })
    );

    wdigTargets.forEach((t) =>
      routes.push({
        id: `route.wdig.${t}`,
        target: t,
        payload: { pattern },
        timestamp
      })
    );

    civicTargets.forEach((t) =>
      routes.push({
        id: `route.civic.${t}`,
        target: t,
        payload: { metas },
        timestamp
      })
    );

    return routes;
  }
}
