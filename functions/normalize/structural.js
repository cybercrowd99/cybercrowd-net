export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);
  const payload = url.searchParams.get("payload") || "";

  // Attempt JSON parse
  let jsonObj = null;
  try {
    jsonObj = JSON.parse(payload);
  } catch {}

  // Attempt XML parse
  let xmlDoc = null;
  if (!jsonObj && payload.trim().startsWith("<") && payload.trim().endsWith(">")) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(payload, "application/xml");
      if (!doc.querySelector("parsererror")) xmlDoc = doc;
    } catch {}
  }

  // Flatten JSON
  function flattenJSON(obj, prefix = "", out = {}) {
    for (const key in obj) {
      const val = obj[key];
      const path = prefix ? `${prefix}.${key}` : key;
      if (val && typeof val === "object" && !Array.isArray(val)) {
        flattenJSON(val, path, out);
      } else {
        out[path] = val;
      }
    }
    return out;
  }

  // Flatten XML
  function flattenXML(node, path = "", out = {}) {
    const name = node.nodeName;
    const newPath = path ? `${path}.${name}` : name;

    // Text content
    if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
      out[newPath] = node.childNodes[0].nodeValue.trim();
      return out;
    }

    // Recurse children
    for (const child of node.children) {
      flattenXML(child, newPath, out);
    }

    return out;
  }

  let result = payload;
  let normalization = "plaintext";

  if (jsonObj) {
    result = flattenJSON(jsonObj);
    normalization = "json_flatten";
  } else if (xmlDoc) {
    result = flattenXML(xmlDoc.documentElement);
    normalization = "xml_flatten";
  }

  return new Response(JSON.stringify({
    normalized: true,
    normalization,
    result
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
