export async function verifySession() {
  try {
    const sessionResp = await fetch("/api/auth/session", {
      method: "GET",
      headers: { "Cache-Control": "no-store" }
    });

    const result = await sessionResp.json();

    if (!result || !result.data || !result.data.session) {
      return { ok: false, reason: "no_session" };
    }

    const session = result.data.session;

    localStorage.setItem("cc_verified_session", "supabase");
    localStorage.setItem("cc_verified_email", session.user.email || "");
    localStorage.setItem("cc_verified_user_id", session.user.id || "");

    const callbackResp = await fetch("/api/auth/callback", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: session.user.id,
        email: session.user.email
      })
    });

    if (!callbackResp.ok) {
      return { ok: false, reason: "callback_failed" };
    }

    return { ok: true };

  } catch (err) {
    return { ok: false, reason: "exception" };
  }
}

verifySession().then((outcome) => {
  if (outcome.ok) {
    window.location.href = "/dashboard-surface.html";
  } else {
    window.location.href = "/login.html";
  }
});
