export async function onRequest() {
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

  return new Response(JSON.stringify({
    introspection: {
      staticFilters,
      dynamicFilters,
      sanitationFilters,
      normalizationFilters
    }
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
