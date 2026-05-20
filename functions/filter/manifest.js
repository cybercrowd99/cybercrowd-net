export async function onRequest() {
  const manifest = {
    staticFilters: [
      "strip_null_bytes",
      "enforce_utf8",
      "trim_whitespace"
    ],
    dynamicFilters: [
      "adaptive_sanitization",
      "rate_sensitive_filtering"
    ],
    sanitationFilters: [
      "remove_control_chars",
      "collapse_repeated_delimiters"
    ],
    normalizationFilters: [
      "unicode_normalize",
      "header_normalize"
    ]
  };

  return new Response(JSON.stringify({
    manifest
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
