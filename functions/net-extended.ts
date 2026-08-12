// functions/net-extended.ts
// CyberCrowd — NET Extended Surface (Pages Runtime)
// ONE JOB: Expose extended NET metadata through Cloudflare Pages Functions.

export async function onRequest(context) {
  const { request } = context;

  return new Response(
    JSON.stringify(
      {
        surface: "NET",
        mode: "EXTENDED",
        execution: "PAGES_RUNTIME",
        requestUrl: request.url,

        subsystem: "CyberCrowd-NET",
        boundary: "NET-EXTENDED-SURFACE",

        // High-level NET metadata envelope
        metadata: {
          lineage: {
            registration: "NET-LINEAGE-REGISTRATION",
            consolidation: "NET-LINEAGE-CONSOLIDATION",
            finalization: "NET-LINEAGE-FINALIZATION"
          },
          capability: {
            declared: "NET-CAPABILITY",
            registration: "NET-CAPABILITY-REGISTRATION"
          },
          receivers: {
            connection: "NET-CONNECTION-RUNTIME",
            proximity: "NET-PROXIMITY-INTENT",
            repeatedStep: "NET-REPEATED-STEP-FRICTION",
            cybercade: "NET-CYBERCADE-GAME-ROOM",
            pixelprix: "NET-PIXELPRIX-DISPLAY"
          }
        },

        // Structural state (public-safe)
        state: {
          continuity: "NET-CONTINUITY-NEUTRAL",
          structural: "NET-STRUCTURE-ACTIVE",
          surface: "NET-SURFACE-EXTENDED"
        }
      },
      null,
      2
    ),
    {
      status: 200,
      headers: { "content-type": "application/json" }
    }
  );
}
