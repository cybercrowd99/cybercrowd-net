// sovereign/global-mesh-registry.ts

import { CAPTURE_NET_SOVEREIGN_INTEGRATION } from "../capture-net/capture-net-sovereign-integration-manifest";
import { CDC_INTEGRATION_CHANNELS } from "./cdc-integration-layer";
import { WDIG_BINDINGS } from "./wdig-binding-layer";
import { CIVIC_ROUTES } from "../civic/civic-transparency-dashboard";
import { CONTINUITY_RULES } from "./spatial-continuity-engine";
import { DoctrineLayer } from "./doctrine-layer";

export class GlobalMeshRegistry {
  private doctrine = new DoctrineLayer();

  listSovereignChannels() {
    return CAPTURE_NET_SOVEREIGN_INTEGRATION.channels;
  }

  listCDCChannels() {
    return CDC_INTEGRATION_CHANNELS;
  }

  listWDIGBindings() {
    return WDIG_BINDINGS;
  }

  listCivicRoutes() {
    return CIVIC_ROUTES;
  }

  listContinuityRules() {
    return CONTINUITY_RULES;
  }

  listDoctrineVectors() {
    return this.doctrine.getDoctrineVectors();
  }

  listContradictionBlocks() {
    return this.doctrine.getContradictionBlocks();
  }

  listHarmonics() {
    return this.doctrine.getHarmonics();
  }

  getFullRegistry() {
    return {
      sovereignChannels: this.listSovereignChannels(),
      cdcChannels: this.listCDCChannels(),
      wdigBindings: this.listWDIGBindings(),
      civicRoutes: this.listCivicRoutes(),
      continuityRules: this.listContinuityRules(),
      doctrineVectors: this.listDoctrineVectors(),
      contradictionBlocks: this.listContradictionBlocks(),
      harmonics: this.listHarmonics()
    };
  }
}
