// admin/user_lookup.js
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
      found: false,
      account: null,
      reason: "anonymous"
    });
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return json({
      found: false,
      account: null,
      reason: "malformed_scorebook_entry"
    });
  }

  const [ball] = parts;

  // ball must follow cc_at_bat|<accountId>|<inning>
  if (!ball.startsWith("cc_at_bat|")) {
    return json({
      found: false,
      account: null,
      reason: "invalid_ball_format"
    });
  }

  const segments = ball.split("|");
  // cc_at_bat | accountId | inning
  const accountId = segments[1] || null;

  if (!accountId) {
    return json({
      found: false,
      account: null,
      reason: "invalid_or_unknown_account"
    });
  }

  // deterministic lookup key (scorebook hash)
  const data = new TextEncoder().encode(accountId);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  const arr = Array.from(new Uint8Array(buffer));
  const lookupKey = arr
    .map(b => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, 24);

  const account = {
    id: accountId,
    lookupKey,
    status: "active",
    tier: "standard",
    created: "unknown",
    flags: []
  };

  return json({
    found: true,
    account
  });
}

function json(obj) {
  return new Response(JSON.stringify(obj, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
