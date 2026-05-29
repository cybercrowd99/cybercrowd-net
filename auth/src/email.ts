export async function sendVerificationEmail(env, email, token) {
  const verifyUrl = `https://cybercrowd.net/verify-get?token=${encodeURIComponent(token)}`;

  const body = {
    From: "no-reply@cybercrowd.net",
    To: email,
    Subject: "Verify your CyberCrowd email",
    TextBody: `Click to verify your email: ${verifyUrl}`
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
    throw new Error(`Postmark error: ${res.status}`);
  }

  return true;
}
