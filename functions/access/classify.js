export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;

  const auth = headers.get("authorization");
  const cfAccess = headers.get("cf-access-jwt-assertion");

  const cookieHeader = headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(v => {
      const [k, ...rest] = v.trim().split("=");
      return [k, rest.join("=")];
    })
  );

  const cc = cookies["cc_access"] || null;

  let level = "anonymous";

  if (auth) level = "bearer";
  else if (cfAccess) level = "cloudflare-access";
  else if (cc) level = "cybercrowd-token";
  else if (cookieHeader.length > 0) level = "session-cookie";

  return new Response(JSON.stringify({
    accessLevel: level,
    signals: {
      authorization: !!auth,
      cloudflareAccess: !!cfAccess,
      cybercrowdToken: !!cc,
      hasCookies: cookieHeader.length > 0
    }
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
