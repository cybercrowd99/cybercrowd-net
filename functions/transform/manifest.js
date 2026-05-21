export async function onRequest() {
  const manifest = {
    staticTransforms: [
      "lowercase",
      "collapse_spaces",
      "strip_surrounding_quotes"
    ],
    dynamicTransforms: [
      "adaptive_rewrite",
      "contextual_restructure"
    ],
    structuralTransforms: [
      "json_normalize",
      "flatten_nested_objects"
    ],
    semanticTransforms: [
      "keyword_extract",
      "intent_map"
    ]
  };

  return new Response(JSON.stringify({
    manifest
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
