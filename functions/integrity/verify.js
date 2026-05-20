export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const payload = url.searchParams.get("payload") || "";
  const providedHash = (url.searchParams.get("hash") || "").toLowerCase();
  const mode = (url.searchParams.get("mode") || "exact_match").toLowerCase();

  const supportedModes = ["exact_match", "prefix_match", "suffix_match"];
  const verificationMode = supportedModes.includes(mode) ? mode : "exact_match";

  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(payload));
  const arr = Array.from(new Uint8Array(buf));
  const expectedHash = arr.map(b => b.toString(16).padStart(2, "0")).join("");

  let verified = false;
  let reason = "mismatch";

  if (!providedHash) {
    return new Response(JSON.stringify({
      verified: false,
      mode: verificationMode,
      expectedHash,
      providedHash,
      reason: "missing_provided_hash"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (verificationMode === "exact_match") {
    verified = providedHash === expectedHash;
    reason = verified ? "exact_match" : "hash_mismatch";
  }

  if (verificationMode === "prefix_match") {
    verified = expectedHash.startsWith(providedHash);
    reason = verified ? "prefix_match" : "prefix_mismatch";
  }

  if (verificationMode === "suffix_match") {
    verified = expectedHash.endsWith(providedHash);
    reason = verified ? "suffix_match" : "suffix_mismatch";
  }

  return new Response(JSON.stringify({
    verified,
    mode: verificationMode,
    expectedHash,
    providedHash,
    reason
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
