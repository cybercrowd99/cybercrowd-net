export async function onRequest(context) {
  const headers = context.request.headers;

  const widthHeader = headers.get("sec-ch-viewport-width");
  const ua = headers.get("user-agent") || "";
  const lower = ua.toLowerCase();

  let width = widthHeader ? parseInt(widthHeader, 10) : null;

  let form = "unknown";

  if (width !== null) {
    if (width < 600) form = "phone";
    else if (width < 900) form = "tablet";
    else if (width < 1600) form = "desktop";
    else form = "large-display";
  } else {
    if (lower.includes("mobile")) form = "phone";
    else if (lower.includes("tablet")) form = "tablet";
    else form = "desktop";
  }

  return new Response(JSON.stringify({
    viewportWidth: width,
    formfactor: form
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
