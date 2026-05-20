export async function onRequest() {
  const manifest = {
    static: [
      "read_public",
      "read_metadata",
      "introspect_account"
    ],
    dynamic: [
      "session_refresh",
      "session_validate"
    ],
    tierBased: {
      standard: ["basic_access"],
      premium: ["basic_access", "extended_access"],
      admin: ["basic_access", "extended_access", "admin_panel"]
    },
    accountFlags: [
      "suspended",
      "beta_user",
      "elevated_review"
    ]
  };

  return new Response(JSON.stringify({
    manifest
  }, null, 2), {
    headers: { "Content-Type": "application/json" }
  });
}
