// EMAIL FUNCTION — CLEANED OF RESEND REFERENCES

export default {
    async fetch(request, env) {
        return new Response(
            JSON.stringify({
                status: "ok",
                message: "Email function placeholder — Resend removed."
            }),
            {
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
};
export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return new Response("Missing fields", { status: 400 });
    }

    const result = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "X-Postmark-Server-Token": env.POSTMARK_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        From: "noreply@cybercrowd.net",
        To: to,
        Subject: subject,
        HtmlBody: html
      })
    });

    const data = await result.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
