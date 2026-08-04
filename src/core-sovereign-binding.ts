/**
 * CyberCrowd — CORE Sovereign Binding V1
 *
 * Purpose:
 * - Bind the SovereignSystemView into the CORE 13-organ interpretation boundary.
 * - Provide CORE with a bounded, immutable, non-authoritative read of the
 *   completed sovereign envelope view.
 *
 * Does NOT:
 * - mutate CORE internal state
 * - mutate Anchor, OSAR, NET, or Sovereign Envelope
 * - authorize behavior
 * - create lineage
 */

import type { SovereignSystemView } from "./sovereign-system-view";

export interface CoreSovereignBinding {
  readonly coreStructureReference: string;

  readonly envelopeReference: string;
  readonly anchorReference: string;
  readonly osarStructureReference: string;
  readonly netDomainReference: string;

  readonly netCompletionProofReference: string;
  readonly netCoreEnvelopeReference: string;

  readonly boundAt: string;
}

export const bindSovereignSystemViewToCore = (
  coreStructureReference: string,
  view: SovereignSystemView,
): CoreSovereignBinding => {

  if (!coreStructureReference) {
    throw new Error("INVALID_CORE_STRUCTURE_REFERENCE");
  }

  const now =
    new Date().toISOString();

  return Object.freeze({
    coreStructureReference,

    envelopeReference:
      view.envelopeReference,

    anchorReference:
      view.anchorReference,

    osarStructureReference:
      view.osarStructureReference,

    netDomainReference:
      view.netDomainReference,

    netCompletionProofReference:
      view.netCompletionProofReference,

    netCoreEnvelopeReference:
      view.netCoreEnvelopeReference,

    boundAt:
      now,
  });
};
