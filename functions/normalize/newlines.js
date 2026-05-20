export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  let payload = url.searchParams.get("payload") || "";

  // Convert CRLF → LF
  payload = payload.replace(/\r\n/g, "\n");

  // Convert CR → LF
  payload = payload.replace(/\r/g, "\n");

  return new Response(JSON.stringify({
    normalized: true,
    normalization: "newlines",
    result: payload
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
