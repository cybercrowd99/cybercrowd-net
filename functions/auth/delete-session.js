export async function onRequest(context) {
  return new Response(JSON.stringify({ deleted: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "cc_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
    }
  });
}
