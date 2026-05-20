export async function onRequest() {
  const wall = Date.now();
  const mono = performance.now();

  return new Response(JSON.stringify({
    wall,
    mono,
    drift: wall - Math.floor(mono)
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
