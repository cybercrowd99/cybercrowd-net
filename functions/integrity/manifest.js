export async function onRequest() {
  const manifest = {
    hashingAlgorithms: [
      "sha256",
      "sha384",
      "sha512"
    ],
    verificationModes: [
      "exact_match",
      "prefix_match",
      "suffix_match"
    ],
    integrityClasses: [
      "weak",
      "standard",
      "strong"
    ]
  };

  return new Response(JSON.stringify({
    manifest
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
