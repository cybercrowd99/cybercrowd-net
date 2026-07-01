// functions/api/net/snapshot.js
//
// CyberCrowd Net Snapshot Route
//
// ONE JOB:
// Expose CyberCrowdNet.snapshot() deliberately.
//
// Read-only.
// Does not init.
// Does not reset.
// Does not bind adapters manually.
// Does not mutate the net spine.
//
// This route is the explicit real snapshot surface.

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
      action: "cybercrowd_net_snapshot",
      route: "functions/api/net/snapshot.js",
      real: true,
      snapshot
    });
  } catch (error) {
    return json(
      {
        ok: false,
        action: "cybercrowd_net_snapshot",
        route: "functions/api/net/snapshot.js",
        error: "NET_SNAPSHOT_FAILED",
        message: error instanceof Error ? error.message : "Unknown net snapshot error."
      },
      500
    );
  }
}

export async function onRequestPost() {
  return json(
    {
      ok: false,
      action: "cybercrowd_net_snapshot",
      error: "METHOD_NOT_ALLOWED",
      message: "Use GET to retrieve CyberCrowd-net snapshot."
    },
    405
  );
}
