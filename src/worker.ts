import postgres from "postgres";

interface Env {
  VERIFY_KV: KVNamespace;
  POSTMARK_TOKEN: string;
  HYPERDRIVE: any;
}

const TOKEN_TTL = 900;
const TOKEN_LENGTH = 32;

function generateToken(): string {
  const bytes = new Uint8Array(TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(a)),
    crypto.subtle.digest("SHA-256", encoder.encode(b)),
  ]);
  return crypto.subtle.timingSafeEqual(hashA, hashB);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/verify" && request.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) return new Response("Missing token", { status: 400 });

      return new Response(
        `<!DOCTYPE html><html><body>
          <form method="POST" action="/verify">
            <input type="hidden" name="token" value="${token}">
            <button type="submit">Verify Email</button>
          </form>
        </body></html>`,
        { headers: { "Content-Type": "text/html", "Cache-Control": "no-store" } }
      );
    }

    if (url.pathname === "/verify" && request.method === "POST") {
      const formData = await request.formData();
      const providedToken = formData.get("token") as string;
      if (!providedToken) return new Response("Missing token", { status: 400 });

      const stored = await env.VERIFY_KV.get(`token:${providedToken}`, {
        type: "json",
        cacheTtl: 30,
      });

      if (!stored) {
        return new Response("Token expired or invalid", {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        });
      }

      const expectedToken = stored.token as string;
      const isValid = await timingSafeEqual(providedToken, expectedToken);

      if (!isValid) {
        return new Response("Invalid token", {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        });
      }

      await env.VERIFY_KV.delete(`token:${providedToken}`);

      const sql = postgres(env.HYPERDRIVE.connectionString, {
        max: 5,
        fetch_types: false,
        prepare: true,
      });

      try {
        const result = await sql`
          UPDATE users
          SET email_verified = true, verified_at = NOW()
          WHERE email = ${stored.email}
        `;
        if (result.count === 0) {
          return new Response("User not found", { status: 404 });
        }
      } finally {
        await sql.end();
      }

      return new Response("Email verified!", {
        headers: { "Cache-Control": "no-store" },
      });
    }

    if (url.pathname === "/send-verification" && request.method === "POST") {
      const { email } = await request.json() as { email: string };
      const token = generateToken();

      await env.VERIFY_KV.put(`token:${token}`, JSON.stringify({ email, token, created: Date.now() }), {
        expirationTtl: TOKEN_TTL,
      });

      const verifyUrl = `https://cybercrowd.net/verify?token=${token}`;
      await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "X-Postmark-Server-Token": env.POSTMARK_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          From: "noreply@cybercrowd.net",
          To: email,
          Subject: "Verify your email",
          HtmlBody: `<a href="${verifyUrl}">Verify your email</a>`,
        }),
      });

      return Response.json({ success: true });
    }

    return new Response("Not found", { status: 404 });
  },
};
