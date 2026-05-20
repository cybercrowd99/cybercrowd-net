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
      authenticated: false,
      account: "anonymous"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const parts = token.split(".");
  const payload = parts[0] || "";

  const decoded = (() => {
    try {
      return atob(payload);
    } catch {
      return null;
    }
  })();

  let accountId = null;
  if (decoded && decoded.startsWith("cc_account|")) {
    accountId = decoded.split("|")[1] || null;
  }

  return new Response(JSON.stringify({
    authenticated: !!accountId,
    account: accountId || "unknown"
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
