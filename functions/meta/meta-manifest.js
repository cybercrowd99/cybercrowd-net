export async function onRequest() {
  const manifest = {
    meta: [
      "version",
      "environment",
      "build"
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
