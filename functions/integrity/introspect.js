export async function onRequest() {
  const hashingAlgorithms = [
    "sha256",
    "sha384",
    "sha512"
  ];

  const verificationModes = [
    "exact_match",
    "prefix_match",
    "suffix_match"
  ];

  const integrityClasses = [
    "weak",
    "standard",
    "strong"
  ];

  return new Response(JSON.stringify({
    introspection: {
      hashingAlgorithms,
      verificationModes,
      integrityClasses
    }
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
