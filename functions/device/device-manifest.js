export async function onRequest() {
  const manifest = {
    device: [
      "agent",
      "capabilities",
      "formfactor"
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
