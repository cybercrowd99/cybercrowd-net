export async function onRequest() {
  const manifest = {
    auth: [
      "signup",
      "login",
      "logout"
    ],
    session: [
      "session-status",
      "refresh-session",
      "delete-session"
    ],
    diagnostics: [
      "whoami",
      "validate-token",
      "token-info",
      "token-expiry"
    ],
    integrity: [
      "token-signature",
      "token-hash"
    ],
    utility: [
      "token-echo"
    ]
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
