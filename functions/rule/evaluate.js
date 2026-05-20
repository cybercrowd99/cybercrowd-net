export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const rule = url.searchParams.get("rule") || null;

  if (!rule) {
    return new Response(JSON.stringify({
      evaluated: false,
      allowed: false,
      reason: "missing_rule"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const staticRules = [
    "request_shape",
    "header_requirements",
    "method_constraints"
  ];

  const dynamicRules = [
    "rate_modulation",
    "adaptive_constraints"
  ];

  const all = [...staticRules, ...dynamicRules];

  if (!all.includes(rule)) {
    return new Response(JSON.stringify({
      evaluated: true,
      allowed: false,
      rule,
      reason: "unknown_rule"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const allowed = staticRules.includes(rule);

  return new Response(JSON.stringify({
    evaluated: true,
    allowed,
    rule,
    class: allowed ? "soft_enforce" : "hard_enforce"
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
