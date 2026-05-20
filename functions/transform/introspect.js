export async function onRequest() {
  const staticTransforms = [
    "lowercase",
    "collapse_spaces",
    "strip_surrounding_quotes"
  ];

  const dynamicTransforms = [
    "adaptive_rewrite",
    "contextual_restructure"
  ];

  const structuralTransforms = [
    "json_normalize",
    "flatten_nested_objects"
  ];

  const semanticTransforms = [
    "keyword_extract",
    "intent_map"
  ];

  return new Response(JSON.stringify({
    introspection: {
      staticTransforms,
      dynamicTransforms,
      structuralTransforms,
      semanticTransforms
    }
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
