export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const transform = url.searchParams.get("transform") || null;

  if (!transform) {
    return new Response(JSON.stringify({
      evaluated: false,
      applicable: false,
      reason: "missing_transform"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

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

  const all = [
    ...staticTransforms,
    ...dynamicTransforms,
    ...structuralTransforms,
    ...semanticTransforms
  ];

  if (!all.includes(transform)) {
    return new Response(JSON.stringify({
      evaluated: true,
      applicable: false,
      transform,
      reason: "unknown_transform"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  let transformClass = "static";
  if (dynamicTransforms.includes(transform)) transformClass = "dynamic";
  if (structuralTransforms.includes(transform)) transformClass = "structural";
  if (semanticTransforms.includes(transform)) transformClass = "semantic";

  return new Response(JSON.stringify({
    evaluated: true,
    applicable: true,
    transform,
    class: transformClass
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
