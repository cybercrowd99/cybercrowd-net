// cybercrowd/operator-console.ts

import { CONTINUITY_RULES, SpatialContinuityEngine } from "../sovereign/spatial-continuity-engine";
import { CIVIC_ROUTES } from "../sovereign/civic-signal-layer";
import { CDC_INTEGRATION_CHANNELS } from "../sovereign/cdc-integration-layer";
import { WDIG_BINDINGS } from "../sovereign/wdig-binding-layer";

export interface OperatorPanel {
  id: string;
  label: string;
  description: string;
}

export interface OperatorCommand {
  id: string;
  description: string;
  execute: (...args: any[]) => any;
}

export class CyberCrowdOperatorConsole {
  constructor(
    private continuity: SpatialContinuityEngine,
    private wdig: typeof WDIG_BINDINGS
  ) {}

  panels: OperatorPanel[] = [
    {
      id: "panel.continuity",
      label: "Spatial Continuity",
      description: "View cross-surface continuity state and propagation rules"
    },
    {
      id: "panel.civic",
      label: "Civic Signals",
      description: "Inspect civic-grade signals and routing classes"
    },
    {
      id: "panel.cdc",
      label: "CDC Channels",
      description: "View CDC integration channels and governance levels"
    },
    {
      id: "panel.wdig",
      label: "WDIG Bindings",
      description: "Inspect spatial routes, surfaces, and binding priorities"
    }
  ];

  commands: OperatorCommand[] = [
    {
      id: "cmd.inspect.surface",
      description: "Inspect continuity state for a given surface",
      execute: (surface: string) => this.continuity.getStateForSurface(surface)
    },
    {
      id: "cmd.list.cdc",
      description: "List all CDC integration channels",
      execute: () => CDC_INTEGRATION_CHANNELS
    },
    {
      id: "cmd.list.civic.routes",
      description: "List all civic routing classes",
      execute: () => CIVIC_ROUTES
    },
    {
      id: "cmd.list.wdig",
      description: "List all WDIG bindings",
      execute: () => this.wdig
    }
  ];

  getPanels(): OperatorPanel[] {
    return this.panels;
  }

  getCommands(): OperatorCommand[] {
    return this.commands;
  }
}
