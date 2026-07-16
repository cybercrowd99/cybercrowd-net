export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;

  const auth =
    headers.get("authorization") ||
    headers.get("x-access-token") ||
    null;

  const cookieHeader = headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(v => {
      const [k, ...rest] = v.trim().split("=");
      return [k, rest.join("=")];
    })
  );

  const cc = cookies["cc_access"] || null;
  const token = auth || cc;

  if (!token) {
    return new Response(JSON.stringify({
      found: false,
      account: null,
      reason: "anonymous"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const parts = token.split(".");
  const payload = parts[0] || "";

  let decoded = null;
  try {
    decoded = atob(payload);
  } catch {
    decoded = null;
  }

  let accountId = null;
  if (decoded && decoded.startsWith("cc_account|")) {
    accountId = decoded.split("|")[1] || null;
  }

  if (!accountId) {
    return new Response(JSON.stringify({
      found: false,
      account: null,
      reason: "invalid_or_unknown_account"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const data = new TextEncoder().encode(accountId);
  const buffer = await crypto.subtle.digest("SHA-256", data);
  const arr = Array.from(new Uint8Array(buffer));
  const lookupKey = arr.map(b => b.toString(16).padStart(2, "0")).join("").substring(0, 24);

  const account = {
    id: accountId,
    lookupKey,
    status: "active",
    tier: "standard",
    created: "unknown",
    flags: []
  };

  return new Response(JSON.stringify({
    found: true,
    account
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
