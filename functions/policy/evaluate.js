export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const policy = url.searchParams.get("policy") || null;

  if (!policy) {
    return new Response(JSON.stringify({
      evaluated: false,
      allowed: false,
      reason: "missing_policy"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const staticPolicies = [
    "payload_integrity",
    "request_consistency",
    "symbolic_tolerance"
  ];

  const dynamicPolicies = [
    "collapse_prevention",
    "doctrine_enforcement"
  ];

  const all = [...staticPolicies, ...dynamicPolicies];

  if (!all.includes(policy)) {
    return new Response(JSON.stringify({
      evaluated: true,
      allowed: false,
      policy,
      reason: "unknown_policy"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const allowed = staticPolicies.includes(policy);

  return new Response(JSON.stringify({
    evaluated: true,
    allowed,
    policy,
    class: allowed ? "soft_gate" : "doctrine_gate"
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
