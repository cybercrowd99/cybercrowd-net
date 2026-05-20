export async function onRequest() {
  const manifest = {
    whitespaceNormalization: [
      "trim_edges",
      "collapse_internal_spaces",
      "collapse_tabs"
    ],
    newlineNormalization: [
      "convert_crlf_to_lf",
      "convert_cr_to_lf"
    ],
    unicodeNormalization: [
      "NFC",
      "NFD",
      "NFKC",
      "NFKD"
    ],
    structuralNormalization: [
      "flatten_json",
      "flatten_xml"
    ]
  };

  return new Response(JSON.stringify({ manifest }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
