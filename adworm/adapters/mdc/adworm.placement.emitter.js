/* ============================================================
   adWorm — MDC PLACEMENT EMITTER
   CyberCrowd NET → CyberCrowd MetaData Center

   Purpose:
   Emit placement events when adWorm enters a surface slot.

   Owns:
   - placement event creation trigger

   Does NOT own:
   - storage
   - analytics
   - pricing
   - consent
   - approvals
   ============================================================ */

import { adWormMDCBridge } from "./adworm.mdc.bridge.js";


export function createAdWormPlacementEmitter(config = {}) {

  const bridge = config.bridge || adWormMDCBridge;


  return {

    onSlotEnter({
      wormId,
      campaignId,
      slot,
      surface
    }) {

      const event = bridge.emitPlacement({
        wormId,
        campaignId,
        slot,
        surface
      });


      console.log(
        "[adWorm][MDC] Placement emitted:",
        event
      );


      return event;
    }

  };
}
