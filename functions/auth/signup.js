export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { email } = await request.json();
        if (!email) {
            return new Response(JSON.stringify({ error: "Email required" }), { status: 400 });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await env.ENROLLMENT_DB.prepare(
            "INSERT INTO enrollments (email, code, created_at) VALUES (?, ?, datetime('now'))"
        ).bind(email, code).run();

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
            const err = await res.text();
            return new Response(JSON.stringify({ error: "Email send failed", detail: err }), { status: 500 });
        }

        return new Response(JSON.stringify({ ok: true }), { status: 200 });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
