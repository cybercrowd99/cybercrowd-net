/* ============================================================
   adWorm — MDC BRIDGE ADAPTER
   CyberCrowd NET → CyberCrowd MetaData Center

   Purpose:
   Translate adWorm runtime events into MDC event envelopes.

   Owns:
   - adWorm to MDC event translation
   - placement event forwarding contract

   Does NOT own:
   - ledger storage
   - valuation
   - consent decisions
   - campaign approval
   - rendering
   - UI

   Boundary:
   NET Runtime → MDC Internal Metadata Layer
   ============================================================ */

import { createPlacementEvent } from "cybercrowdMDC/adapters/adworm/adworm.metadata.js";


/* ============================================================
   BRIDGE FACTORY
   ============================================================ */

export function createAdWormMDCBridge(config = {}) {

  const source = config.source || "adWorm";


  return {

    /* --------------------------------------------------------
       Create placement metadata event
       -------------------------------------------------------- */

    emitPlacement({
      wormId,
      campaignId,
      slot,
      surface,
      timestamp = Date.now()
    }) {

      return createPlacementEvent({
        eventType: "placement",
        source,

        wormId,
        campaignId,
        slot,
        surface,

        timestamp
      });
    },


    /* --------------------------------------------------------
       Future MDC event routes
       -------------------------------------------------------- */

    emitAttention(payload = {}) {
      return {
        eventType: "attention",
        source,
        timestamp: Date.now(),
        payload
      };
    },


    emitValue(payload = {}) {
      return {
        eventType: "value",
        source,
        timestamp: Date.now(),
        payload
      };
    }

  };
}


/* ============================================================
   DEFAULT INSTANCE
   ============================================================ */

export const adWormMDCBridge = createAdWormMDCBridge();
