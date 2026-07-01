// functions/api/net/init.js
//
// CyberCrowd Net Init Route
//
// ONE JOB:
// Expose a deliberate Worker route that initializes CyberCrowd-net on purpose.
//
// This route is allowed to touch the net spine.
// Status route is not.

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
      result
    });
  } catch (error) {
    return json(
      {
        ok: false,
        action: "cybercrowd_net_init_route",
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
