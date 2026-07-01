// functions/api/net/init.js
//
// CyberCrowd Net Init Route
//
// ONE JOB:
// Expose the deliberate CyberCrowd-net init endpoint without breaking deploy.
//
// This route is reserved for net init.
// For now it does not import the net spine until all src files resolve.

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
    action: "cybercrowd_net_init_route",
    route: "functions/api/net/init.js",
    status: "reserved",
    initialized: false,
    imports_net_spine: false,
    message: "CyberCrowd-net init route is reserved. Net spine import is locked until core files resolve."
  });
}

export async function onRequestGet() {
  return json(
    {
      ok: false,
      action: "cybercrowd_net_init_route",
      error: "METHOD_NOT_ALLOWED",
      message: "Use POST for the reserved CyberCrowd-net init route."
    },
    405
  );
}
