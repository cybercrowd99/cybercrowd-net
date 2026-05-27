export async function ensureSession() {
const token = localStorage.getItem("sessionToken") || "";
if (!token) { window.location.href="/login.html"; return; }
const res = await fetch("/api/auth/session", {
method: "GET",
headers: { "Authorization": "Bearer " + token }
});
if (!res.ok) { window.location.href="/login.html"; return; }
const data = await res.json();
if (!data.active) { window.location.href="/login.html"; return; }
return data;
}
