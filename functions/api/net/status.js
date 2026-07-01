// functions/api/net/status.js
//
// CyberCrowd Net Status Route
//
// ONE JOB:
// Expose a safe Worker route that reads CyberCrowdNet.snapshot()
// without mutating the chain.
//
// Reads only.
// Does not init.
// Does not reset.
// Does not bind adapters.

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
      snapshot
    });
  } catch (error) {
    return json(
      {
        ok: false,
        action: "cybercrowd_net_status",
        error: "NET_STATUS_FAILED",
        message: error instanceof Error ? error.message : "Unknown net status error."
      },
      500
    );
  }
}
