export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const payload = url.searchParams.get("payload") || "";
  const algo = (url.searchParams.get("algo") || "sha256").toLowerCase();

  const supported = ["sha256", "sha384", "sha512"];
  const algorithm = supported.includes(algo) ? algo : "sha256";

  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest(algorithm.toUpperCase(), enc.encode(payload));
  const arr = Array.from(new Uint8Array(buf));
  const hash = arr.map(b => b.toString(16).padStart(2, "0")).join("");

  let integrityClass = "weak";
  if (algorithm === "sha256") integrityClass = "standard";
  if (algorithm === "sha512") integrityClass = "strong";

  return new Response(JSON.stringify({
    hashed: true,
    algorithm,
    integrityClass,
    payloadLength: payload.length,
    hash
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
