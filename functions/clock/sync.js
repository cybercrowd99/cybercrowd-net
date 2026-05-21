export async function onRequest() {
  const wall = Date.now();
  const mono = performance.now();
  const drift = wall - Math.floor(mono);

  const token = `${wall}:${Math.floor(mono)}`;

  return new Response(JSON.stringify({
    wall,
    mono,
    drift,
    token
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
