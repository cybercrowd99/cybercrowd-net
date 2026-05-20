export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const filter = url.searchParams.get("filter") || null;

  if (!filter) {
    return new Response(JSON.stringify({
      evaluated: false,
      allowed: false,
      reason: "missing_filter"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const staticFilters = [
    "strip_null_bytes",
    "enforce_utf8",
    "trim_whitespace"
  ];

  const dynamicFilters = [
    "adaptive_sanitization",
    "rate_sensitive_filtering"
  ];

  const sanitationFilters = [
    "remove_control_chars",
    "collapse_repeated_delimiters"
  ];

  const normalizationFilters = [
    "unicode_normalize",
    "header_normalize"
  ];

  const all = [
    ...staticFilters,
    ...dynamicFilters,
    ...sanitationFilters,
    ...normalizationFilters
  ];

  if (!all.includes(filter)) {
    return new Response(JSON.stringify({
      evaluated: true,
      allowed: false,
      filter,
      reason: "unknown_filter"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  let filterClass = "static";
  if (dynamicFilters.includes(filter)) filterClass = "dynamic";
  if (sanitationFilters.includes(filter)) filterClass = "sanitation";
  if (normalizationFilters.includes(filter)) filterClass = "normalization";

  const allowed = !sanitationFilters.includes(filter);

  return new Response(JSON.stringify({
    evaluated: true,
    allowed,
    filter,
    class: filterClass
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
