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
// HUMAN ENTRY TRACK:
// REAL CLOUDFLARE TURNSTILE
// → REAL HUMAN INTERACTION
// → POST /api/auth/human-verify
// → CLOUDFLARE SITEVERIFY
// → SERVER HUMAN PASS
// → EMAIL SURFACE AUTHORIZED
// → EMAIL ENTERED
// → SEND
// → HUMAN PASS CONSUMED
// → 900-SECOND EMAIL TOKEN
// → POSTMARK
//
// SECURITY LAW:
// NO FAKE SECURITY UI.
// NO SECURITY THEATER.
// NO CLIENT-ONLY HUMAN AUTHORITY.
// Cloudflare token is validated exactly once.
// Private auth issues the temporary human pass.
// Send requires that server-issued human pass.
//
// RECOVERY LOCK:
// No frontend change in this cell.
// No auth/src/verify.ts change.
// No auth/src/email.ts change.
// No duplicate Turnstile helper.
// No bridge.
// No envelope.

import {
  createVerificationToken,
  consumeVerificationToken
} from "./verify";

import {
  sendVerificationEmail
} from "./email";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const headers = {
      "Cache-Control": "no-store"
    };

    if (
      url.pathname === "/api/auth/human-verify" &&
      request.method === "POST"
    ) {
      const origin =
        request.headers.get("Origin") || "";

      if (
        origin !== "https://cybercrowd.net" &&
        origin !== "https://www.cybercrowd.net"
      ) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason: "origin-rejected"
          },
          {
            status: 403,
            headers
          }
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return Response.json(
          {
            ok: false,
            success: false,
            reason: "invalid-json"
          },
          {
            status: 400,
            headers
          }
        );
      }

      const turnstileToken =
        body["cf-turnstile-response"];

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

      const verifyForm =
        new FormData();

      verifyForm.append(
        "secret",
        env.TURNSTILE_SECRET_KEY
      );

      verifyForm.append(
        "response",
        turnstileToken
      );

      const remoteIp =
        request.headers.get("CF-Connecting-IP");

      if (remoteIp) {
        verifyForm.append(
          "remoteip",
          remoteIp
        );
      }

      const verifyResponse =
        await fetch(
          "https://challenges.cloudflare.com/turnstile/v0/siteverify",
          {
            method: "POST",
            body: verifyForm
          }
        );

      const human =
        await verifyResponse.json();

      const validHostname =
        human.hostname === "cybercrowd.net" ||
        human.hostname === "www.cybercrowd.net";

      if (
        human.success !== true ||
        validHostname !== true
      ) {
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

      const passBytes =
        crypto.getRandomValues(
          new Uint8Array(32)
        );

      const humanPass =
        Array.from(passBytes)
          .map((byte) =>
            byte
              .toString(16)
              .padStart(2, "0")
          )
          .join("");

      await env.VERIFY_KV.put(
        `human:${humanPass}`,
        "verified",
        {
          expirationTtl: 300
        }
      );

      return Response.json(
        {
          ok: true,
          success: true,
          human: true
        },
        {
          headers: {
            ...headers,
            "Set-Cookie":
              `cc_human_pass=${humanPass}; Path=/; Max-Age=300; HttpOnly; Secure; SameSite=Strict`
          }
        }
      );
    }

    if (
      url.pathname === "/api/auth/send-verification" &&
      request.method === "POST"
    ) {
      const origin =
        request.headers.get("Origin") || "";

      if (
        origin !== "https://cybercrowd.net" &&
        origin !== "https://www.cybercrowd.net"
      ) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason: "origin-rejected"
          },
          {
            status: 403,
            headers
          }
        );
      }

      let body;

      try {
        body = await request.json();
      } catch {
        return Response.json(
          {
            ok: false,
            success: false,
            reason: "invalid-json"
          },
          {
            status: 400,
            headers
          }
        );
      }

      const email =
        String(body.email || "")
          .trim();

      if (!email) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason: "missing-email"
          },
          {
            status: 400,
            headers
          }
        );
      }

      const cookieHeader =
        request.headers.get("Cookie") || "";

      const humanPassMatch =
        cookieHeader.match(
          /(?:^|;\s*)cc_human_pass=([a-f0-9]{64})(?:;|$)/
        );

      const humanPass =
        humanPassMatch
          ? humanPassMatch[1]
          : null;

      if (!humanPass) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason: "human-pass-required"
          },
          {
            status: 403,
            headers
          }
        );
      }

      const humanKey =
        `human:${humanPass}`;

      const humanState =
        await env.VERIFY_KV.get(
          humanKey
        );

      if (humanState !== "verified") {
        return Response.json(
          {
            ok: false,
            success: false,
            reason: "human-pass-invalid"
          },
          {
            status: 403,
            headers
          }
        );
      }

      await env.VERIFY_KV.delete(
        humanKey
      );

      const token =
        await createVerificationToken(
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
          headers: {
            ...headers,
            "Set-Cookie":
              "cc_human_pass=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict"
          }
        }
      );
    }

    if (
      url.pathname === "/api/auth/verify" &&
      request.method === "GET"
    ) {
      const token =
        url.searchParams.get("token");

      if (!token) {
        return new Response(
          "Missing token",
          {
            status: 400,
            headers
          }
        );
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
      const formData =
        await request.formData();

      const token =
        formData.get("token");

      if (!token) {
        return new Response(
          "Missing token",
          {
            status: 400,
            headers
          }
        );
      }

      const result =
        await consumeVerificationToken(
          env,
          token
        );

      if (!result.ok) {
        return new Response(
          "Token expired or invalid",
          {
            status: 400,
            headers
          }
        );
      }

      return new Response(
        "Email verified!",
        {
          headers
        }
      );
    }

    return new Response(
      "Not Found",
      {
        status: 404
      }
    );
  }
};
