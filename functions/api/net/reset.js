// functions/api/net/reset.js
//
// CyberCrowd Net Reset Route
//
// ONE JOB:
// Make CyberCrowd-net reset deliberate.
//
// POST only.
// GET forbidden.
// Allowed to mutate because POST is deliberate.
// Does not reset the chain manually.
// Does not swallow core.
// Delegates reset to CyberCrowdNet.

import { CyberCrowdNet } from "../../../src/cybercrowd-net";

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export async function onRequestPost() {
  try {
    const result = CyberCrowdNet.reset();

    return json({
      ok: result.ok,
      action: "cybercrowd_net_reset_route",
      route: "functions/api/net/reset.js",
      real: true,
      result
    });
  } catch (error) {
    return json(
      {
        ok: false,
        action: "cybercrowd_net_reset_route",
        route: "functions/api/net/reset.js",
        error: "NET_RESET_ROUTE_FAILED",
        message: error instanceof Error ? error.message : "Unknown net reset error."
      },
      500
    );
  }
}

export async function onRequestGet() {
  return json(
    {
      ok: false,
      action: "cybercrowd_net_reset_route",
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST to reset CyberCrowd-net."
    },
    405
  );
}
