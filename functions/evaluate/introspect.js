export async function onRequest() {
  const introspection = {
    sizeEvaluators: {
      byteLength: "counts UTF-8 encoded bytes",
      charLength: "counts JavaScript string characters",
      sizeClass: ["small", "medium", "large", "oversized"]
    },
    entropyEvaluators: {
      entropy: "Shannon entropy in bits",
      diversity: "unique symbol count",
      entropyClass: ["low", "medium", "high", "chaotic"]
    },
    structureEvaluators: {
      structureClass: ["json", "xml", "plaintext", "unknown"]
    },
    formatEvaluators: {
      formatClass: ["json", "xml", "plaintext", "unknown"]
    },
    aggregateEvaluation: {
      fields: [
        "size.byteLength",
        "size.charLength",
        "size.sizeClass",
        "entropy.entropy",
        "entropy.diversity",
        "entropy.entropyClass",
        "structure.structureClass",
        "format.formatClass"
      ]
    }
  };

  return new Response(JSON.stringify({ introspection }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
