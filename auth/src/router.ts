// CYBERCROWD
// REPO: cybercrowd99/cybercrowd-net
// PATH: auth/src/router.ts
//
// DEPLOYED CELL:
// cybercrowd-auth
//
// BUILD LAW:
// PRIVATE AUTH REQUEST ENTRANCE
//
// JOB:
// Route CyberCrowd private-auth requests.
//
// EXISTING TRACK:
// human verification
// email verification
// verification-token consumption
//
// RETURNING MEMBER TRACK:
// email -> existing identity
// existing password -> verified identity + session
//
// NO NET AUTHORITY.
// NO ACCOUNT CREATION.
// NO PASSWORD CREATION.
// NO PASSWORD MUTATION.

import {
  createVerificationToken,
  consumeVerificationToken
} from "./verify";

import {
  sendVerificationEmail
} from "./email";

import {
  emailServiceEnabled
} from "../email-service-gate.js";

const RETURNING_SESSION_TTL_SECONDS =
  86400 * 7;

const RETURNING_PASSWORD_ITERATIONS =
  100000;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const headers = {
      "Cache-Control": "no-store"
    };

    if (
      url.pathname ===
        "/api/auth/returning-email-match" &&
      request.method === "POST"
    ) {
      let body;

      try {
        body =
          await request.json();
      } catch {
        return Response.json(
          {
            success: false,
            matched: false,
            error: "invalid-json"
          },
          {
            status: 400,
            headers
          }
        );
      }

      const email =
        String(
          body?.email || ""
        )
          .trim()
          .toLowerCase();

      if (!email) {
        return Response.json(
          {
            success: false,
            matched: false,
            error: "email_missing"
          },
          {
            status: 400,
            headers
          }
        );
      }

      if (!env.IDENTITY) {
        return Response.json(
          {
            success: false,
            matched: false,
            error:
              "identity_storage_missing"
          },
          {
            status: 500,
            headers
          }
        );
      }

      const identityActiveId =
        String(
          await env.IDENTITY.get(
            `user-email:${email}`
          ) || ""
        ).trim();

      if (!identityActiveId) {
        return Response.json(
          {
            success: true,
            matched: false
          },
          {
            status: 200,
            headers
          }
        );
      }

      return Response.json(
        {
          success: true,
          matched: true,
          identity_active_id:
            identityActiveId
        },
        {
          status: 200,
          headers
        }
      );
    }

    if (
      url.pathname ===
        "/api/auth/login" &&
      request.method === "POST"
    ) {
      let body;

      try {
        body =
          await request.json();
      } catch {
        return Response.json(
          {
            success: false,
            error: "invalid-json"
          },
          {
            status: 400,
            headers
          }
        );
      }

      const email =
        String(
          body?.email || ""
        )
          .trim()
          .toLowerCase();

      const password =
        String(
          body?.password || ""
        );

      if (
        !email ||
        !password
      ) {
        return Response.json(
          {
            success: false,
            error:
              "missing_credentials"
          },
          {
            status: 400,
            headers
          }
        );
      }

      if (!env.IDENTITY) {
        return Response.json(
          {
            success: false,
            error:
              "identity_storage_missing"
          },
          {
            status: 500,
            headers
          }
        );
      }

      const identityActiveId =
        String(
          await env.IDENTITY.get(
            `user-email:${email}`
          ) || ""
        ).trim();

      if (!identityActiveId) {
        return Response.json(
          {
            success: false,
            error:
              "account_not_found"
          },
          {
            status: 404,
            headers
          }
        );
      }

      const rawUser =
        await env.IDENTITY.get(
          `user:${identityActiveId}`
        );

      if (!rawUser) {
        return Response.json(
          {
            success: false,
            error:
              "account_not_found"
          },
          {
            status: 404,
            headers
          }
        );
      }

      let user;

      try {
        user =
          JSON.parse(rawUser);
      } catch {
        return Response.json(
          {
            success: false,
            error:
              "identity_record_corrupt"
          },
          {
            status: 500,
            headers
          }
        );
      }

      const storedHash =
        String(
          user?.passwordHash ||
          user?.password_hash ||
          ""
        ).trim();

      if (!storedHash) {
        return Response.json(
          {
            success: false,
            error:
              "password_not_set"
          },
          {
            status: 403,
            headers
          }
        );
      }

      const iterations =
        Number(
          user?.password_hash_iterations ||
          RETURNING_PASSWORD_ITERATIONS
        );

      if (
        !Number.isInteger(
          iterations
        ) ||
        iterations <= 0
      ) {
        return Response.json(
          {
            success: false,
            error:
              "password_record_invalid"
          },
          {
            status: 500,
            headers
          }
        );
      }

      const encoder =
        new TextEncoder();

      const keyMaterial =
        await crypto.subtle.importKey(
          "raw",
          encoder.encode(
            password
          ),
          "PBKDF2",
          false,
          [
            "deriveBits"
          ]
        );

      const bits =
        await crypto.subtle.deriveBits(
          {
            name: "PBKDF2",
            salt:
              encoder.encode(
                email
              ),
            iterations,
            hash: "SHA-256"
          },
          keyMaterial,
          256
        );

      const suppliedHash =
        [
          ...new Uint8Array(
            bits
          )
        ]
          .map(
            (byte) =>
              byte
                .toString(16)
                .padStart(
                  2,
                  "0"
                )
          )
          .join("");

      if (
        suppliedHash.length !==
        storedHash.length
      ) {
        return Response.json(
          {
            success: false,
            error:
              "invalid_credentials"
          },
          {
            status: 401,
            headers
          }
        );
      }

      let difference = 0;

      for (
        let index = 0;
        index <
        suppliedHash.length;
        index += 1
      ) {
        difference |=
          suppliedHash.charCodeAt(
            index
          ) ^
          storedHash.charCodeAt(
            index
          );
      }

      if (difference !== 0) {
        return Response.json(
          {
            success: false,
            error:
              "invalid_credentials"
          },
          {
            status: 401,
            headers
          }
        );
      }

      const sessionBytes =
        crypto.getRandomValues(
          new Uint8Array(32)
        );

      const eat =
        Array.from(
          sessionBytes
        )
          .map(
            (byte) =>
              byte
                .toString(16)
                .padStart(
                  2,
                  "0"
                )
          )
          .join("");

      const now =
        Date.now();

      const sessionRecord = {
        eat,
        token: eat,
        "identity-active-id":
          identityActiveId,
        identity_active_id:
          identityActiveId,
        identity_id:
          identityActiveId,
        identityId:
          identityActiveId,
        email,
        epoch: now,
        band: "user",
        created_at:
          new Date(
            now
          ).toISOString(),
        expires_at:
          new Date(
            now +
              RETURNING_SESSION_TTL_SECONDS *
                1000
          ).toISOString()
      };

      await env.IDENTITY.put(
        `session:${eat}`,
        JSON.stringify(
          sessionRecord
        ),
        {
          expirationTtl:
            RETURNING_SESSION_TTL_SECONDS
        }
      );

      return Response.json(
        {
          success: true,
          identity_active_id:
            identityActiveId
        },
        {
          status: 200,
          headers: {
            ...headers,
            "Set-Cookie":
              `EAT=${eat}; Path=/; Max-Age=${RETURNING_SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`
          }
        }
      );
    }

    if (
      url.pathname ===
        "/api/auth/human-verify" &&
      request.method === "POST"
    ) {
      const origin =
        request.headers.get(
          "Origin"
        ) || "";

      if (
        origin !==
          "https://cybercrowd.net" &&
        origin !==
          "https://www.cybercrowd.net"
      ) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason:
              "origin-rejected"
          },
          {
            status: 403,
            headers
          }
        );
      }

      let body;

      try {
        body =
          await request.json();
      } catch {
        return Response.json(
          {
            ok: false,
            success: false,
            reason:
              "invalid-json"
          },
          {
            status: 400,
            headers
          }
        );
      }

      const turnstileToken =
        body[
          "cf-turnstile-response"
        ];

      if (!turnstileToken) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason:
              "missing-turnstile-token"
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
        request.headers.get(
          "CF-Connecting-IP"
        );

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
        human.hostname ===
          "cybercrowd.net" ||
        human.hostname ===
          "www.cybercrowd.net";

      if (
        human.success !== true ||
        validHostname !== true
      ) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason:
              "turnstile-failed"
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
        Array.from(
          passBytes
        )
          .map(
            (byte) =>
              byte
                .toString(16)
                .padStart(
                  2,
                  "0"
                )
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
      url.pathname ===
        "/api/auth/send-verification" &&
      request.method === "POST"
    ) {
      if (
        emailServiceEnabled(
          env
        ) !== true
      ) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason:
              "email-service-disabled"
          },
          {
            status: 503,
            headers
          }
        );
      }

      const origin =
        request.headers.get(
          "Origin"
        ) || "";

      if (
        origin !==
          "https://cybercrowd.net" &&
        origin !==
          "https://www.cybercrowd.net"
      ) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason:
              "origin-rejected"
          },
          {
            status: 403,
            headers
          }
        );
      }

      let body;

      try {
        body =
          await request.json();
      } catch {
        return Response.json(
          {
            ok: false,
            success: false,
            reason:
              "invalid-json"
          },
          {
            status: 400,
            headers
          }
        );
      }

      const email =
        String(
          body.email || ""
        ).trim();

      if (!email) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason:
              "missing-email"
          },
          {
            status: 400,
            headers
          }
        );
      }

      const cookieHeader =
        request.headers.get(
          "Cookie"
        ) || "";

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
            reason:
              "human-pass-required"
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

      if (
        humanState !==
        "verified"
      ) {
        return Response.json(
          {
            ok: false,
            success: false,
            reason:
              "human-pass-invalid"
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
      url.pathname ===
        "/api/auth/verify" &&
      request.method === "GET"
    ) {
      const token =
        url.searchParams.get(
          "token"
        );

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
            "Content-Type":
              "text/html"
          }
        }
      );
    }

    if (
      url.pathname ===
        "/api/auth/verify" &&
      request.method === "POST"
    ) {
      const formData =
        await request.formData();

      const token =
        formData.get(
          "token"
        );

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
