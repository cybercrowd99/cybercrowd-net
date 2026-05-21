export async function onRequest() {
  const manifest = {
    staticRules: [
      "request_shape",
      "header_requirements",
      "method_constraints"
    ],
    dynamicRules: [
      "rate_modulation",
      "adaptive_constraints"
    ],
    evaluationRules: [
      "payload_scan",
      "structure_analysis"
    ],
    enforcementRules: [
      "soft_enforce",
      "hard_enforce"
    ]
  };

  return new Response(JSON.stringify({
    manifest
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
