export async function onRequest(context) {
  const req = context.request;
  const url = new URL(req.url);

  const payload = url.searchParams.get("payload") || "";
  const trimmed = payload.trim();

  // JSON detection
  let isJSON = false;
  try {
    JSON.parse(payload);
    isJSON = true;
  } catch {
    isJSON = false;
  }

  // XML detection
  let isXML = false;
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
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

  let formatClass = "plaintext";
  let reason = "default_plaintext";

  if (isJSON) {
    formatClass = "json";
    reason = "valid_json_format";
  } else if (isXML) {
    formatClass = "xml";
    reason = "valid_xml_format";
  } else if (!trimmed) {
    formatClass = "unknown";
    reason = "empty_payload";
  }

  return new Response(JSON.stringify({
    evaluated: true,
    formatClass,
    reason
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
