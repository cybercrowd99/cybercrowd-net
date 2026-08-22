// CYBERCROWD
// REPO: cybercrowd99/cybercrowd-net
// PATH: auth/src/router.ts
//
// DEPLOYED CELL:
// cybercrowd-auth
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Route CyberCrowd private-auth requests.
//
// TRACK:
// create-account.html
// → create-account.js
// → Cloudflare Turnstile
// → cf-turnstile-response
// → POST /api/auth/send-verification
// → cybercrowd-auth
// → auth/src/router.ts
// → Cloudflare Turnstile siteverify
// → createVerificationToken()
// → auth/src/verify.ts
// → sendVerificationEmail()
// → auth/src/email.ts
// → POSTMARK
// → { ok:true, success:true }
//
// SECURITY BOUNDARY:
// PUBLIC REQUESTS.
// PRIVATE AUTH DECIDES.
// Turnstile token MUST be verified server-side
// before verification-token creation.
//
// RECOVERY LOCK:
// No new route.
// No new helper.
// No bridge.
// No envelope.
// No frontend change.
// No auth/src/verify.ts change.
// No auth/src/email.ts change.

import { createVerificationToken, consumeVerificationToken } from "./verify";
import { sendVerificationEmail } from "./email";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const headers = { "Cache-Control": "no-store" };

    if (
      url.pathname === "/api/auth/send-verification" &&
      request.method === "POST"
    ) {
      const {
        email,
        "cf-turnstile-response": turnstileToken
      } = await request.json();

      if (!email) {
        return new Response("Missing email", {
          status: 400,
          headers
        });
      }

      if (!turnstileToken) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason: "missing-turnstile-token"
          },
          {
            status: 400,
            headers
          }
        );
      }

      const verifyForm = new FormData();

      verifyForm.append(
        "secret",
        env.TURNSTILE_SECRET_KEY
      );

      verifyForm.append(
        "response",
        turnstileToken
      );

      const verifyResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: verifyForm
        }
      );

      const human = await verifyResponse.json();

      if (human.success !== true) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason: "turnstile-failed"
          },
          {
            status: 403,
            headers
          }
        );
      }

      const token = await createVerificationToken(
        env,
        email
      );

      await sendVerificationEmail(
        email,
        token,
        env
      );

      return Response.json(
        {
          ok: true,
          success: true
        },
        {
          headers
        }
      );
    }

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

      const result = await consumeVerificationToken(
        env,
        token
      );

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
