export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const form = url.searchParams;
  let payload = form.get("payload") || "";
  const mode = (form.get("mode") || "NFC").toUpperCase();

  const allowed = ["NFC", "NFD", "NFKC", "NFKD"];
  const selected = allowed.includes(mode) ? mode : "NFC";

  let result = payload.normalize(selected);

  return new Response(JSON.stringify({
    normalized: true,
    normalization: "unicode",
    mode: selected,
    result
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
