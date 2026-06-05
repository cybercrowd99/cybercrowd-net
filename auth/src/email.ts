// Put this in auth/src/email.ts (or wherever you keep email helpers)

export async function sendVerificationEmail(toEmail: string, token: string, env: Env) {
  const verifyUrl = `https://cybercrowd.net/api/auth/verify?token=${encodeURIComponent(token)}`;

  const body = {
    From: "CyberCrowd <welcome@cybercrowd.net>",
    To: toEmail,
    Subject: "Verify your new CyberCrowd email address",
    HtmlBody: `
      <h2>Email Change Request</h2>
      <p>You requested to change your email on CyberCrowd.</p>
      <p>Click the button below to confirm:</p>
      <a href="${verifyUrl}" 
         style="display:inline-block;padding:14px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;">
        Verify New Email
      </a>
      <p style="color:#666; margin-top:20px;">
        This link expires in 15 minutes.<br>
        If you did not request this change, ignore this email.
      </p>
    `,
    TextBody: `Verify your new email: ${verifyUrl}\n\nThis link expires in 15 minutes.`
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
    console.error("Postmark error:", res.status, error);
    throw new Error(`Postmark error: ${res.status}`);
  }

  return true;
}
