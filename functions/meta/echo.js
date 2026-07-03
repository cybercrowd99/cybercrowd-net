export async function onRequest(context) {
  const request = context.request;

  const method = request.method;
  const url = request.url;

  const headers = {};
  for (const [k, v] of request.headers.entries()) {
    headers[k] = v;
  }

  let body = null;
  try {
    body = await request.text();
  } catch {
    body = null;
  }

  console.log("CYBERCROWD_META_ECHO", {
    receiver: "functions/meta/echo.js",
    lane: "meta",
    method,
    url,
    body
  });

  return new Response(JSON.stringify({
    ok: true,
    receiver: "functions/meta/echo.js",
    lane: "meta",
    echo: "meta-echo-ok",

    method,
    url,
    headers,
    body
  }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
