// admin/identity_lookup.js
export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;

  // incoming at‑bat token from header or cookie
  const auth =
    headers.get("authorization") ||
    headers.get("x-at-bat-token") ||
    null;

  const cookieHeader = headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(v => {
      const [k, ...rest] = v.trim().split("=");
      return [k, rest.join("=")];
    })
  );

  const cc = cookies["cc_at_bat"] || null;

  const token = auth || cc;

  if (!token) {
    return json({
      authenticated: false,
      account: "anonymous"
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return json({
      authenticated: false,
      account: "unknown",
      reason: "malformed_scorebook_entry"
    });
  }

  const [ball] = parts;

  // ball must follow cc_at_bat|<accountId>|<inning>
  if (!ball.startsWith("cc_at_bat|")) {
    return json({
      authenticated: false,
      account: "unknown",
      reason: "invalid_ball_format"
    });
  }

  const segments = ball.split("|");
  // cc_at_bat | accountId | inning
  const accountId = segments[1] || null;

  return json({
    authenticated: !!accountId,
    account: accountId || "unknown"
  });
}

function json(obj) {
  return new Response(JSON.stringify(obj, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
