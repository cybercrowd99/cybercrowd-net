/**
 * NET FILE: functions/api/auth/echo.js
 * Repository: cybercrowd99/cybercrowd-net
 * CyberCrowd | Auth Echo
 *
 * Purpose:
 * Echo the incoming request for route diagnostics.
 *
 * Owns:
 * Request method, URL, headers, body, and JSON echo response.
 *
 * Does NOT own:
 * PING intake, proximity matching, session creation,
 * identity storage, PING delivery, or routing.
 */

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

  return new Response(JSON.stringify({
    method,
    url,
    headers,
    body
  }, null, 2), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}
