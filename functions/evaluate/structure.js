export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const payload = url.searchParams.get("payload") || "";

  // JSON detection
  let isJSON = false;
  try {
    JSON.parse(payload);
    isJSON = true;
  } catch {
    isJSON = false;
  }

  // XML detection (very lightweight)
  let isXML = false;
  if (payload.trim().startsWith("<") && payload.trim().endsWith(">")) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(payload, "application/xml");
      if (!doc.querySelector("parsererror")) {
        isXML = true;
      }
    } catch {
      isXML = false;
    }
  }

  let structureClass = "plaintext";
  let reason = "default_plaintext";

  if (isJSON) {
    structureClass = "json";
    reason = "valid_json_structure";
  } else if (isXML) {
    structureClass = "xml";
    reason = "valid_xml_structure";
  } else if (!payload.trim()) {
    structureClass = "unknown";
    reason = "empty_payload";
  }

  return new Response(JSON.stringify({
    evaluated: true,
    structureClass,
    reason
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
