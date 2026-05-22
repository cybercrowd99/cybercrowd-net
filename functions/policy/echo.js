export async function onRequest(context) {
  const req = context.request;

  // Basic request metadata
  const method = req.method;
  const url = req.url;

  // Headers → object
  const headers = {};
  for (const [k, v] of req.headers.entries()) {
    headers[k] = v;
  }

  // Dynamic body reader (safe for Cloudflare)
  let raw = null;
  let json = null;
  let form = null;

  try {
    const clone = req.clone();
    raw = await clone.text();

    // Try JSON
    try {
      json = JSON.parse(raw);
    } catch {}

    // Try form
    try {
      const formData = await req.clone().formData();
      form = {};
      for (const key of formData.keys()) {
        form[key] = formData.get(key);
      }
    } catch {}
  } catch {
    raw = "[unreadable]";
  }

  // Dynamic classification
  const bodyType =
    json ? "json" :
    form ? "form" :
    raw ? "text" :
    "none";

  return new Response(JSON.stringify({
    cybercrowd: true,
    evaluated: true,
    method,
    url,
    headers,
    bodyType,
    raw,
    json,
    form
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
