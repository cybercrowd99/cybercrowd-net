export async function onRequest() {
  const manifest = {
    sizeEvaluators: [
      "byte_length",
      "character_length"
    ],
    entropyEvaluators: [
      "shannon_entropy",
      "symbol_diversity"
    ],
    structureEvaluators: [
      "json_structure",
      "xml_structure"
    ],
    formatEvaluators: [
      "is_json",
      "is_xml",
      "is_plaintext"
    ]
  };

  return new Response(JSON.stringify({
    manifest
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
