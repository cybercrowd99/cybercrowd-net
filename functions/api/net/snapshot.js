// functions/api/net/snapshot.js
//
// CyberCrowd Net Snapshot Route
//
// ONE JOB:
// Expose a safe CyberCrowd-net snapshot endpoint without breaking deploy.
//
// Read-only.
// Does not init.
// Does not reset.
// Does not bind adapters.
// Does not import the net spine yet.

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
  return json({
    ok: true,
    action: "cybercrowd_net_snapshot",
    route: "functions/api/net/snapshot.js",
    status: "reserved",
    reads_only: true,
    mutates_chain: false,
    initializes_net: false,
    resets_net: false,
    binds_adapters: false,
    imports_net_spine: false,
    routes: {
      status: "/api/net/status",
      init: "/api/net/init",
      snapshot: "/api/net/snapshot"
    },
    message: "CyberCrowd-net snapshot route is reserved. Net spine import is locked until core files resolve."
  });
}

export async function onRequestPost() {
  return json(
    {
      ok: false,
      action: "cybercrowd_net_snapshot",
      error: "METHOD_NOT_ALLOWED",
      message: "Use GET to retrieve the reserved CyberCrowd-net snapshot route."
    },
    405
  );
}
