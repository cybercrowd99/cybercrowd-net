/* ============================================================
   [NET]
   CyberCrowd NET

   File:
   security/vault-policy-router.ts

   Purpose:
   Routes NET vault session requests to the appropriate
   CyberCrowd policy profile before protected surfaces
   are initialized.

   Owns:
   - policy routing
   - surface classification
   - immutable routing envelopes
   - policy selection

   Does NOT own:
   - authentication
   - authorization
   - password validation
   - identity creation
   - MDC requests
   - metadata mutation
   - ledger operations

   Boundary:

   VAULT SESSION
          |
          ▼
   VAULT POLICY ROUTER
          |
          ▼
   NET SURFACE INITIALIZATION

   Core Rule:

   The router selects a policy path.
   The router does not approve access.

============================================================ */

export type VaultPolicy =
  | "EXECUTIVE"
  | "ADMIN"
  | "ENGINEERING"
  | "OPERATIONS"
  | "SUPPORT"
  | "READ_ONLY"
  | "DENY";

export interface VaultPolicyRequest {

  employeeUIDL: string;

  sessionReference: string;

  requestedSurface: string;

}

export interface VaultPolicyRoute {

  readonly type: "vault-policy-route";

  readonly version: "VPR-1";

  readonly employeeUIDL: string;

  readonly sessionReference: string;

  readonly requestedSurface: string;

  readonly policy: VaultPolicy;

  readonly routedAt: number;

}

export class VaultPolicyRouter {

  route(
    request: VaultPolicyRequest
  ): VaultPolicyRoute {

    return Object.freeze({

      type:
        "vault-policy-route",

      version:
        "VPR-1",

      employeeUIDL:
        cleanId(request.employeeUIDL),

      sessionReference:
        cleanId(request.sessionReference),

      requestedSurface:
        cleanSurface(request.requestedSurface),

      policy:
        determinePolicy(
          request.requestedSurface
        ),

      routedAt:
        Date.now()

    });

  }

}

export const CyberCrowdVaultPolicyRouter =
  new VaultPolicyRouter();

function determinePolicy(
  surface: string
): VaultPolicy {

  switch (
    cleanSurface(surface)
  ) {

    case "executive":
      return "EXECUTIVE";

    case "admin":
      return "ADMIN";

    case "engineering":
      return "ENGINEERING";

    case "operations":
      return "OPERATIONS";

    case "support":
      return "SUPPORT";

    case "public":
      return "READ_ONLY";

    default:
      return "DENY";

  }

}

function cleanSurface(
  value: unknown
): string {

  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .slice(0,64);

}

function cleanId(
  value: unknown
): string {

  if (
    typeof value !== "string" &&
    typeof value !== "number"
  ) {
    return "";
  }

  return String(value)
    .trim()
    .slice(0,128);

}
