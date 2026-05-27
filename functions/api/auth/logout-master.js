export async function onRequestPost(context) {
const { request, env } = context;
const SESSION = env.SESSION;
const cookie = request.headers.get("Cookie") || "";
const token = extract(cookie);
if (token) { await SESSION.delete("SESSION:" + token); }
return new Response(JSON.stringify({ ok: true }), {
status: 200,
headers: {
"Content-Type": "application/json",
"Set-Cookie": "sessionId=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
}
});
}
function extract(cookie) {
if (!cookie) return "";
const m = cookie.match(/sessionId=([^;]+)/);
return m ? m[1] : "";
}
