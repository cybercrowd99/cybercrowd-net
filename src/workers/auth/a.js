export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": env.FRONTEND_ORIGIN || "https://cybercrowd.net",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (request.method === "POST" && url.pathname === "/api/register-single") {
        return await handleRegisterSingle(request, env, corsHeaders);
      }

      if (request.method === "GET" && url.pathname === "/api/verify") {
        return await handleVerify(request, env, corsHeaders);
      }

      if (request.method === "POST" && url.pathname === "/api/set-password") {
        return await handleSetPassword(request, env, corsHeaders);
      }

      if (env.ASSETS) {
        return env.ASSETS.fetch(request);
      }

      return new Response("Not found", { status: 404 });
    } catch (err) {
      console.error("Worker error:", err);
      return json({ error: "Internal error" }, 500, corsHeaders);
    }
  }
};

/* ─────────────── REGISTER / VERIFY EMAIL ─────────────── */

async function handleRegisterSingle(request, env, corsHeaders) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, corsHeaders);
  }

  const email = (body.email || "").trim().toLowerCase();
  const turnstileToken = body.turnstileToken;

  if (!email) return json({ error: "Missing email" }, 400, corsHeaders);
  if (!turnstileToken) return json({ error: "Missing Turnstile token" }, 400, corsHeaders);

  // Rate limit: 1 attempt per IP per 60s
  const rateKey = `signup:${ip}`;
  if (await env.SIGNUP_RATE_LIMIT.get(rateKey)) {
    return json({ error: "Too many attempts. Please wait." }, 429, corsHeaders);
  }
  await env.SIGNUP_RATE_LIMIT.put(rateKey, "1", { expirationTtl: 60 });

  // Verify Turnstile
  const verify = await verifyTurnstile(turnstileToken, ip, env);
  if (!verify?.success) {
    return json({ error: "Turnstile verification failed" }, 403, corsHeaders);
  }

  // One-time token → IDENTITY KV (1 hour)
  const oneTime = generateToken();
  await env.IDENTITY.put(`verify:${oneTime}`, email, { expirationTtl: 3600 });

  const origin = env.FRONTEND_ORIGIN || "https://cybercrowd.net";
  // FIX: path was /public/auth/verify.html — your file is /public/verify.html
  const verificationLink = `${origin}/public/verify.html?token=${encodeURIComponent(oneTime)}&email=${encodeURIComponent(email)}`;

  const sent = await sendVerificationEmail(email, verificationLink, env);
  if (!sent) {
    return json({ error: "Failed to send verification email" }, 500, corsHeaders);
  }

  return json({ ok: true }, 200, corsHeaders);
}

async function handleVerify(request, env, corsHeaders) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();

  if (!token || !email) {
    return json({ error: "Missing token or email" }, 400, corsHeaders);
  }

  const kvKey = `verify:${token}`;
  const stored = await env.IDENTITY.get(kvKey);

  if (!stored || stored.toLowerCase() !== email) {
    return json({ error: "Invalid or expired token" }, 400, corsHeaders);
  }

  // Consume token
  await env.IDENTITY.delete(kvKey);

  // Mark user verified in USERS KV
  try {
    const userKey = `user:${email}`;
    const existing = (await env.USERS.get(userKey, { type: "json" })) || {};
    const now = Date.now();
    await env.USERS.put(
      userKey,
      JSON.stringify({
        ...existing,
        verified: true,
        verifiedAt: now,
        createdAt: existing.createdAt || now,
      })
    );
  } catch (e) {
    console.error("USERS KV write failed:", e);
  }

  // Generate a short-lived setup token so verify-success.html can securely set a password
  const setupToken = generateToken();
  await env.IDENTITY.put(`setup:${setupToken}`, email, { expirationTtl: 900 }); // 15 min

  const origin = env.FRONTEND_ORIGIN || "https://cybercrowd.net";
  // FIX: path was /public/auth/verify-success.html — your file is /public/verify-success.html
  return Response.redirect(
    `${origin}/public/verify-success.html?setup=${encodeURIComponent(setupToken)}&email=${encodeURIComponent(email)}`,
    302
  );
}

/* ─────────────── SET PASSWORD (completes the flow) ─────────────── */

async function handleSetPassword(request, env, corsHeaders) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, corsHeaders);
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const setupToken = body.setupToken || "";

  if (!email || !password || !setupToken) {
    return json({ error: "Missing email, password, or setup token" }, 400, corsHeaders);
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400, corsHeaders);
  }

  // Validate setup token
  const setupKey = `setup:${setupToken}`;
  const storedEmail = await env.IDENTITY.get(setupKey);
  if (!storedEmail || storedEmail.toLowerCase() !== email) {
    return json({ error: "Invalid or expired setup token" }, 403, corsHeaders);
  }

  // Consume setup token
  await env.IDENTITY.delete(setupKey);

  // Store password hash (SHA-256 is basic; swap for bcrypt/scrypt if you ever move off KV)
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password + email));
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Update user record
  const userKey = `user:${email}`;
  const existing = (await env.USERS.get(userKey, { type: "json" })) || {};
  const now = Date.now();
  await env.USERS.put(
    userKey,
    JSON.stringify({
      ...existing,
      passwordHash: hash,
      passwordSetAt: now,
    })
  );

  // Create session token
  const sessionToken = generateToken();
  await env.IDENTITY.put(`session:${sessionToken}`, email, { expirationTtl: 86400 * 7 }); // 7 days

  // Set session cookie and return success
  const origin = env.FRONTEND_ORIGIN || "https://cybercrowd.net";
  return json(
    { ok: true, email },
    200,
    {
      ...corsHeaders,
      "Set-Cookie": `session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800`,
    }
  );
}

/* ─────────────── HELPERS ─────────────── */

async function verifyTurnstile(token, remoteIp, env) {
  const params = new URLSearchParams();
  params.append("secret", env.TURNSTILE_SECRET);
  params.append("response", token);
  if (remoteIp) params.append("remoteip", remoteIp);

  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: params,
  });
  if (!resp.ok) return null;
  return resp.json();
}

async function sendVerificationEmail(toEmail, link, env) {
  const body = {
    personalizations: [{ to: [{ email: toEmail }] }],
    from: { email: env.EMAIL_SENDER || "no-reply@cybercrowd.net" },
    subject: "Verify your CyberCrowd account",
    content: [
      {
        type: "text/plain",
        value: `Click to verify your account: ${link}`,
      },
      {
        type: "text/html",
        value: `<p>Click to verify your account:</p><p><a href="${link}">${link}</a></p>`,
      },
    ],
  };

  const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    console.error("SendGrid error:", resp.status, await safeText(resp));
    return false;
  }
  return true;
}

function generateToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

async function safeText(resp) {
  try {
    return await resp.text();
  } catch {
    return "<no body>";
  }
}
