import { handleVerify } from "./verify";
import { handleSendVerification } from "./email";

interface Env {
  VERIFY_KV: KVNamespace;
  DB: D1Database;
  POSTMARK_TOKEN: string;
  CC_SESSION_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const headers = { "Cache-Control": "no-store" };

    // POST /api/auth/send-verification
    if (url.pathname === "/api/auth/send-verification" && request.method === "POST") {
      return handleSendVerification(request, env);
    }

    // GET /api/auth/verify — render confirmation page
    if (url.pathname === "/api/auth/verify" && request.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) return new Response("Missing token", { status: 400, headers });

      return new Response(
        `<!DOCTYPE html><html><body>
          <form method="POST" action="/api/auth/verify">
            <input type="hidden" name="token" value="${token}">
            <button type="submit">Verify Email</button>
          </form>
        </body></html>`,
        { headers: { ...headers, "Content-Type": "text/html" } }
      );
    }

    // POST /api/auth/verify — validate & consume token
    if (url.pathname === "/api/auth/verify" && request.method === "POST") {
      return handleVerify(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};
