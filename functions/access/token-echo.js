export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;

  const token =
    headers.get("authorization") ||
    headers.get("x-access-token") ||
    null;

  return new Response(JSON.stringify({
    token
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
