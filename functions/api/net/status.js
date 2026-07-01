// functions/api/net/status.js
//
// CyberCrowd Net Status Route
//
// ONE JOB:
// Expose a safe Worker route that reports CyberCrowd-net route status.
//
// Reads only.
// Does not init.
// Does not reset.
// Does not bind adapters.
// Does not import the net spine.

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
    action: "cybercrowd_net_status",
    net: "cybercrowd-net",
    route: "functions/api/net/status.js",
    status: "online",
    reads_only: true,
    mutates_chain: false,
    initializes_net: false,
    resets_net: false,
    binds_adapters: false,
    message: "CyberCrowd-net status route is online."
  });
}
