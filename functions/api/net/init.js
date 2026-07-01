// functions/api/net/init.js
//
// CyberCrowd Net Init Route
//
// ONE JOB:
// Make CyberCrowd-net initialization deliberate.
//
// POST only.
// GET forbidden.
// Allowed to mutate because POST is deliberate.
// Does not bind adapters manually.
// Does not swallow core.
// Delegates init to CyberCrowdNet.

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
    const result = CyberCrowdNet.init();

    return json({
      ok: result.ok,
      action: "cybercrowd_net_init_route",
      route: "functions/api/net/init.js",
      real: true,
      result
    });
  } catch (error) {
    return json(
      {
        ok: false,
        action: "cybercrowd_net_init_route",
        route: "functions/api/net/init.js",
        error: "NET_INIT_ROUTE_FAILED",
        message: error instanceof Error ? error.message : "Unknown net init error."
      },
      500
    );
  }
}

export async function onRequestGet() {
  return json(
    {
      ok: false,
      action: "cybercrowd_net_init_route",
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST to initialize CyberCrowd-net."
    },
    405
  );
}
