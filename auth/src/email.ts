export async function sendVerificationEmail(env, email, token) {
  const verifyUrl = `https://cybercrowd.net/api/auth/verify?token=${encodeURIComponent(token)}`;

  const body = {
    From: "CyberCrowd <welcome@cybercrowd.net>",
    To: email,
    Subject: "Verify your CyberCrowd email",
    HtmlBody: `<a href="${verifyUrl}" style="display:inline-block;padding:14px 18px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">Verify Email</a>`,
    TextBody: `Verify your email: ${verifyUrl}`
  };

  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": env.POSTMARK_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Postmark error: ${res.status} — ${error}`);
  }

  return true;
}
