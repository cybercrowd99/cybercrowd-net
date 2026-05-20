export async function onRequest(context) {
  return new Response("", {
    status: 302,
    headers: {
      "Set-Cookie": "cc_access=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",
      "Location": "/"
    }
  });
}
