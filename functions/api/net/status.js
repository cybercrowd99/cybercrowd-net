// functions/api/net/status.js
//
// CyberCrowd Net Status Route
//
// ONE JOB:
// Expose CyberCrowdNet.snapshot() as live status.
//
// Read-only.
// GET only.
// Does not init.
// Does not reset.
// Does not bind adapters manually.
// Does not mutate the net spine.

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

export async function onRequestGet() {
  try {
    const snapshot = CyberCrowdNet.snapshot();

    return json({
      ok: true,
      action: "cybercrowd_net_status",
      route: "functions/api/net/status.js",
      real: true,
      status: snapshot?.snapshot?.stable ? "stable" : "online",
      snapshot
    });
  } catch (error) {
    return json(
      {
        ok: false,
        action: "cybercrowd_net_status",
        route: "functions/api/net/status.js",
        error: "NET_STATUS_FAILED",
        message: error instanceof Error ? error.message : "Unknown net status error."
      },
      500
    );
  }
}

export async function onRequestPost() {
  return json(
    {
      ok: false,
      action: "cybercrowd_net_status",
      error: "METHOD_NOT_ALLOWED",
      message: "Use GET to retrieve CyberCrowd-net status."
    },
    405
  );
}
