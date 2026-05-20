export async function onRequest() {
  const staticRules = [
    "request_shape",
    "header_requirements",
    "method_constraints"
  ];

  const dynamicRules = [
    "rate_modulation",
    "adaptive_constraints"
  ];

  const evaluationRules = [
    "payload_scan",
    "structure_analysis"
  ];

  const enforcementRules = [
    "soft_enforce",
    "hard_enforce"
  ];

  return new Response(JSON.stringify({
    introspection: {
      staticRules,
      dynamicRules,
      evaluationRules,
      enforcementRules
    }
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
