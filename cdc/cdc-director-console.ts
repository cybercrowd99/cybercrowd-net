// cdc/cdc-director-console.ts

import { CDC_INTEGRATION_CHANNELS } from "../sovereign/cdc-integration-layer";
import { CAPTURE_NET_SOVEREIGN_INTEGRATION } from "../capture-net/capture-net-sovereign-integration-manifest";
import { WDIG_BINDINGS } from "../sovereign/wdig-binding-layer";
import { CivicSignal } from "../sovereign/civic-signal-layer";

export interface DirectorTool {
  id: string;
  label: string;
  description: string;
  execute: (...args: any[]) => any;
}

export interface DirectorPanel {
  id: string;
  title: string;
  description: string;
}

export class CDCDirectorConsole {
  panels: DirectorPanel[] = [
    {
      id: "panel.oversight",
      title: "Oversight Signals",
      description: "Inspect global oversight signals from the capture-net overseer"
    },
    {
      id: "panel.metasignals",
      title: "Meta-Signals",
      description: "Trace high-order meta-signals and doctrine vectors"
    },
    {
      id: "panel.lineage",
      title: "Threat Lineage",
      description: "Review lineage graphs and escalation cycles"
    },
    {
      id: "panel.routes",
      title: "Mesh Routes",
      description: "Inspect sovereign and WDIG routes for intelligence propagation"
    }
  ];

  tools: DirectorTool[] = [
    {
      id: "tool.inspect.channel",
      label: "Inspect Channel",
      description: "View full details of a CDC integration channel",
      execute: (id: string) => CDC_INTEGRATION_CHANNELS.find((c) => c.id === id)
    },
    {
      id: "tool.inspect.mesh",
      label: "Inspect Mesh Binding",
      description: "View sovereign-mesh binding details",
      execute: (id: string) =>
        WDIG_BINDINGS.find((b) => b.id === id || b.id.endsWith(id))
    },
    {
      id: "tool.inspect.sovereign",
      label: "Inspect Sovereign Channel",
      description: "View sovereign integration manifest entry",
      execute: (id: string) =>
        CAPTURE_NET_SOVEREIGN_INTEGRATION.channels.find((c) => c.id === id)
    },
    {
      id: "tool.trace.civic",
      label: "Trace Civic Signal",
      description: "Trace a civic signal back to its sovereign origin",
      execute: (signal: CivicSignal) => ({
        class: signal.class,
        summary: signal.summary,
        vectors: signal.publicVectors,
        timestamp: signal.timestamp
      })
    }
  ];

  getPanels() {
    return this.panels;
  }

  getTools() {
    return this.tools;
  }
}
