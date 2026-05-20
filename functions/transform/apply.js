export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const transform = url.searchParams.get("transform") || null;
  const payload = url.searchParams.get("payload") || "";

  const staticTransforms = {
    lowercase: (v) => v.toLowerCase(),
    collapse_spaces: (v) => v.replace(/\s+/g, " ").trim(),
    strip_surrounding_quotes: (v) => v.replace(/^"(.*)"$/, "$1")
  };

  const dynamicTransforms = {
    adaptive_rewrite: (v) => v.replace(/([A-Z]+)/g, m => m.toLowerCase()),
    contextual_restructure: (v) => v.split("").reverse().join("")
  };

  const structuralTransforms = {
    json_normalize: (v) => {
      try {
        const obj = JSON.parse(v);
        return JSON.stringify(obj, null, 2);
      } catch {
        return v;
      }
    },
    flatten_nested_objects: (v) => {
      try {
        const obj = JSON.parse(v);
        const out = {};
        const walk = (o, prefix = "") => {
          for (const k in o) {
            const val = o[k];
            const key = prefix ? `${prefix}.${k}` : k;
            if (val && typeof val === "object" && !Array.isArray(val)) {
              walk(val, key);
            } else {
              out[key] = val;
            }
          }
        };
        walk(obj);
        return JSON.stringify(out, null, 2);
      } catch {
        return v;
      }
    }
  };

  const semanticTransforms = {
    keyword_extract: (v) => {
      const words = v.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
      const freq = {};
      for (const w of words) freq[w] = (freq[w] || 0) + 1;
      return JSON.stringify(freq, null, 2);
    },
    intent_map: (v) => {
      const lower = v.toLowerCase();
      let intent = "unknown";
      if (lower.includes("login") || lower.includes("auth")) intent = "authentication";
      if (lower.includes("buy") || lower.includes("purchase")) intent = "commerce";
      if (lower.includes("search") || lower.includes("find")) intent = "discovery";
      return JSON.stringify({ intent }, null, 2);
    }
  };

  const all = {
    ...staticTransforms,
    ...dynamicTransforms,
    ...structuralTransforms,
    ...semanticTransforms
  };

  if (!transform || !all[transform]) {
    return new Response(JSON.stringify({
      applied: false,
      transform,
      payload,
      reason: "unknown_or_missing_transform"
    }, null, 2), {
      headers: { "Content-Type": "application/json" }
    });
  }

  const result = all[transform](payload);

  return new Response(JSON.stringify({
    applied: true,
    transform,
    original: payload,
    result
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
