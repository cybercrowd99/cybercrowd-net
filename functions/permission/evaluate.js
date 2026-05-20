export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;

  const url = new URL(req.url);
  const capability = url.searchParams.get("cap") || null;

  if (!capability) {
    return new Response(JSON.stringify({
      allowed: false,
      reason: "missing_capability"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

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
      allowed: false,
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
      allowed: false,
      reason: "invalid_or_unknown_account"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const staticCaps = ["read_public", "read_metadata", "introspect_account"];
  const tierCaps = {
    standard: ["basic_access"],
    premium: ["basic_access", "extended_access"],
    admin: ["basic_access", "extended_access", "admin_panel"]
  };

  const tier = "standard";

  const allowed =
    staticCaps.includes(capability) ||
    tierCaps[tier].includes(capability);

  return new Response(JSON.stringify({
    allowed,
    capability,
    accountId,
    tier
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
