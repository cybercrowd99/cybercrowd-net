// functions/api/net/reset.js
//
// CyberCrowd Net Reset Route
//
// ONE JOB:
// Reserve the deliberate CyberCrowd-net reset endpoint without breaking deploy.
//
// POST only.
// GET forbidden.
// Does not import the net spine yet.
// Does not reset anything yet.

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
  return json({
    ok: true,
    action: "cybercrowd_net_reset_route",
    route: "functions/api/net/reset.js",
    status: "reserved",
    reset_performed: false,
    imports_net_spine: false,
    mutates_chain: false,
    message: "CyberCrowd-net reset route is reserved. Net spine import is locked until core files resolve."
  });
}

export async function onRequestGet() {
  return json(
    {
      ok: false,
      action: "cybercrowd_net_reset_route",
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST for the reserved CyberCrowd-net reset route."
    },
    405
  );
}
