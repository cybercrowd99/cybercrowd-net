// admin/token_echo.js
export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;

  // echo the incoming at‑bat token exactly as received
  const token =
    headers.get("authorization") ||
    headers.get("x-at-bat-token") ||
    null;

  return new Response(
    JSON.stringify(
      {
        at_bat: token
      },
      null,
      2
    ),
    {
      headers: { "Content-Type": "application/json" }
    }
  );
}
