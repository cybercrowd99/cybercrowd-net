// admin/access_classify.js
export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;

  // incoming signals
  const atBat =
    headers.get("authorization") ||
    headers.get("x-at-bat-token") ||
    null;

  const cfAccess = headers.get("cf-access-jwt-assertion") || null;

  const cookieHeader = headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(v => {
      const [k, ...rest] = v.trim().split("=");
      return [k, rest.join("=")];
    })
  );

  const cc = cookies["cc_at_bat"] || null;

  // baseball‑mapped access lanes
  let lane = "dugout"; // anonymous

  if (atBat) lane = "at-bat";
  else if (cfAccess) lane = "clubhouse-access";
  else if (cc) lane = "dugout-token";
  else if (cookieHeader.length > 0) lane = "cookie-signal";

  return json({
    lane,
    signals: {
      atBat: !!atBat,
      cfAccess: !!cfAccess,
      dugoutToken: !!cc,
      hasCookies: cookieHeader.length > 0
    }
  });
}

function json(obj) {
  return new Response(JSON.stringify(obj, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
