/* ============================================================
   Clawd Code — AdWorm Presentation Context
   CyberCrowd Presentation Context Boundary

   Purpose:
   Distinguish a transaction object from an independent
   advertising / sponsored placement and produce a bounded
   presentation instruction for the existing AdWorm placement
   path.

   Owns:
   - presentation context classification
   - bounded AdWorm treatment instruction

   Does NOT own:
   - advertising approval
   - payment authorization
   - ownership determination
   - rendering
   - campaign management
   - ledger storage
   - identity inference

   Boundary:
   Clawd Context → AdWorm Presentation Contract
   ============================================================ */

export type ClawdPresentationContext =
  | "TRANSACTION_OBJECT"
  | "PROMOTIONAL_OBJECT"
  | "UNRESOLVED";

export type ClawdPresentationTreatment =
  | "PRESERVE"
  | "ADWORM_CONTROLLED"
  | "CONSERVATIVE";

export interface ClawdPresentationContextInput {
  readonly objectId: string;

  readonly transactionContext?: {
    readonly listingId?: string;
    readonly offerId?: string;
    readonly saleStatus?: "ACTIVE" | "INACTIVE";
  };

  readonly advertisingContext?: {
    readonly placementId?: string;
    readonly campaignId?: string;
    readonly sponsorId?: string;
    readonly sponsored?: boolean;
  };
}

export interface ClawdPresentationDecision {
  readonly context: ClawdPresentationContext;
  readonly treatment: ClawdPresentationTreatment;
  readonly objectId: string;
}

/* ============================================================
   CONTEXT DECISION
   ============================================================ */

export function decideClawdPresentationContext(
  input: ClawdPresentationContextInput
): ClawdPresentationDecision {

  const transactionObject =
    input.transactionContext?.saleStatus === "ACTIVE" &&
    Boolean(
      input.transactionContext.listingId ||
      input.transactionContext.offerId
    );

  const promotionalObject =
    input.advertisingContext?.sponsored === true ||
    Boolean(
      input.advertisingContext?.placementId ||
      input.advertisingContext?.campaignId ||
      input.advertisingContext?.sponsorId
    );

  if (transactionObject && !promotionalObject) {
    return Object.freeze({
      objectId: input.objectId,
      context: "TRANSACTION_OBJECT",
      treatment: "PRESERVE"
    });
  }

  if (promotionalObject) {
    return Object.freeze({
      objectId: input.objectId,
      context: "PROMOTIONAL_OBJECT",
      treatment: "ADWORM_CONTROLLED"
    });
  }

  return Object.freeze({
    objectId: input.objectId,
    context: "UNRESOLVED",
    treatment: "CONSERVATIVE"
  });
}
