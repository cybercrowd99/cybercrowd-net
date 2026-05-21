export async function onRequest(context) {
  const req = context.request;
  const headers = req.headers;

  const color = headers.get("sec-ch-prefers-color-scheme") || null;
  const motion = headers.get("sec-ch-prefers-reduced-motion") || null;
  const width = headers.get("sec-ch-viewport-width") || null;

  const js = headers.has("sec-ch-ua") ? true : false;

  return new Response(JSON.stringify({
    javascript: js,
    colorScheme: color,
    reducedMotion: motion,
    viewportWidth: width
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
