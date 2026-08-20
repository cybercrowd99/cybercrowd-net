import { createVerificationToken, consumeVerificationToken } from "./verify";
import { sendVerificationEmail } from "./email";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = { "Cache-Control": "no-store" };

    // POST /api/auth/send-verification
    if (
      url.pathname === "/api/auth/send-verification" &&
      request.method === "POST"
    ) {
      const { email } = await request.json();

      if (!email) {
        return new Response("Missing email", {
          status: 400,
          headers
        });
      }

      // Create token
      const token = await createVerificationToken(env, email);

      // FIXED ARGUMENT ORDER — THIS IS THE BUG
      await sendVerificationEmail(env, email, token);

      return new Response(
        JSON.stringify({
          ok: true,
          success: true
        }),
        {
          headers: {
            ...headers,
            "Content-Type": "application/json"
          }
        }
      );
    }

    // GET /api/auth/verify — render confirmation page
    if (
      url.pathname === "/api/auth/verify" &&
      request.method === "GET"
    ) {
      const token = url.searchParams.get("token");

      if (!token) {
        return new Response("Missing token", {
          status: 400,
          headers
        });
      }

      return new Response(
        `<!DOCTYPE html><html><body>
          <form method="POST" action="/api/auth/verify">
            <input type="hidden" name="token" value="${token}">
            <button type="submit">Verify Email</button>
          </form>
        </body></html>`,
        {
          headers: {
            ...headers,
            "Content-Type": "text/html"
          }
        }
      );
    }

    // POST /api/auth/verify — validate & consume token
    if (
      url.pathname === "/api/auth/verify" &&
      request.method === "POST"
    ) {
      const formData = await request.formData();
      const token = formData.get("token");

      if (!token) {
        return new Response("Missing token", {
          status: 400,
          headers
        });
      }

      const result = await consumeVerificationToken(env, token);

      if (!result.ok) {
        return new Response("Token expired or invalid", {
          status: 400,
          headers
        });
      }

      return new Response("Email verified!", {
        headers
      });
    }

    return new Response("Not Found", {
      status: 404
    });
  }
};
