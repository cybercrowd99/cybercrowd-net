export async function onRequestPost({ request, env }) {
  const { email } = await request.json();

  if (!email) {
    return new Response(JSON.stringify({ error: "Email required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const payload = {
    From: env.CC_EMAIL_FROM,
    To: email,
    ReplyTo: env.CC_REPLY_TO,
    Subject: "Your CyberCrowd Access Code",
    TextBody: `Your CyberCrowd verification code is: ${code}`
  };

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": env.POSTMARK_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const detail = await res.text();
    return new Response(JSON.stringify({ error: "Email send failed", detail }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
