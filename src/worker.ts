export interface Env {
  IDENTITY: KVNamespace;
  SIGNUP_RATE_LIMIT: KVNamespace;
  USERS: KVNamespace;
  TURNSTILE_SECRET: string;
  SENDGRID_API_KEY: string;
  EMAIL_SENDER: string;
  FRONTEND_ORIGIN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.FRONTEND_ORIGIN || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (url.pathname === "/api/register" && request.method === "POST") {
        return await handleRegister(request, env, corsHeaders);
      }
      if (url.pathname === "/api/verify" && request.method === "POST") {
        return await handleVerify(request, env, corsHeaders);
      }
      if (url.pathname === "/api/set-password" && request.method === "POST") {
        return await handleSetPassword(request, env, corsHeaders);
      }

      return new Response("Not found", { status: 404, headers: corsHeaders });
    } catch (err) {
      console.error(err);
      return json({ error: "Internal server error" }, 500, corsHeaders);
    }
  },
};

/* ─────────────── REGISTER ─────────────── */

async function handleRegister(req: Request, env: Env, cors: HeadersInit) {
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  const { email, turnstileToken } = await req.json();

  if (!email || !turnstileToken) {
    return json({ error: "Missing email or Turnstile token" }, 400, cors);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit: 1 attempt per IP per 60s
  const rateKey = `signup:${ip}`;
  if (await env.SIGNUP_RATE_LIMIT.get(rateKey)) {
    return json({ error: "Rate limited. Wait 60 seconds." }, 429, cors);
  }
  await env.SIGNUP_RATE_LIMIT.put(rateKey, "1", { expirationTtl: 60 });

  // Turnstile: proves human
  const turnstileOk = await verifyTurnstile(turnstileToken, ip, env);
  if (!turnstileOk) {
    return json({ error: "Turnstile verification failed" }, 403, cors);
  }

  // Create verification token
  const verifyToken = generateToken();
  await env.IDENTITY.put(`verify:${verifyToken}`, normalizedEmail, { expirationTtl: 3600 });

  const link = `${env.FRONTEND_ORIGIN}/verify.html?token=${verifyToken}&email=${encodeURIComponent(normalizedEmail)}`;
  const sent = await sendVerificationEmail(normalizedEmail, link, env);

  return json({ ok: sent }, sent ? 200 : 500, cors);
}

/* ─────────────── VERIFY EMAIL ─────────────── */

async function handleVerify(req: Request, env: Env, cors: HeadersInit) {
  const { token, email } = await req.json();
  if (!token || !email) {
    return json({ error: "Missing token or email" }, 400, cors);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const verifyKey = `verify:${token}`;
  const storedEmail = await env.IDENTITY.get(verifyKey);

  if (!storedEmail || storedEmail !== normalizedEmail) {
    return json({ error: "Invalid or expired verification link" }, 400, cors);
  }

  // Consume verify token
  await env.IDENTITY.delete(verifyKey);

  // Create short-lived setup token for password step
  const setupToken = generateToken();
  await env.IDENTITY.put(`setup:${setupToken}`, normalizedEmail, { expirationTtl: 900 }); // 15 min

  // Mark verified in USERS
  const userKey = `user:${normalizedEmail}`;
  const existing = (await env.USERS.get(userKey, { type: "json" })) || {};
  await env.USERS.put(userKey, JSON.stringify({
    ...existing,
    email: normalizedEmail,
    verified: true,
    verifiedAt: Date.now(),
    createdAt: existing.createdAt || Date.now(),
  }));

  return json({ ok: true, setupToken }, 200, cors);
}

/* ─────────────── SET PASSWORD ─────────────── */

async function handleSetPassword(req: Request, env: Env, cors: HeadersInit) {
  const { setupToken, password } = await req.json();

  if (!setupToken || !password) {
    return json({ error: "Missing setup token or password" }, 400, cors);
  }
  if (password.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400, cors);
  }

  // Validate setup token
  const setupKey = `setup:${setupToken}`;
  const email = await env.IDENTITY.get(setupKey);
  if (!email) {
    return json({ error: "Invalid or expired setup session" }, 403, cors);
  }

  // Consume setup token (one-time)
  await env.IDENTITY.delete(setupKey);

  const hash = await hashPassword(password);
  const userKey = `user:${email}`;
  const existing = (await env.USERS.get(userKey, { type: "json" })) || {};

  await env.USERS.put(userKey, JSON.stringify({
    ...existing,
    email,
    passwordHash: hash,
    passwordSetAt: Date.now(),
  }));

  return json({ ok: true, message: "Account ready" }, 200, cors);
}

/* ─────────────── HELPERS ─────────────── */

async function verifyTurnstile(token: string, ip: string, env: Env) {
  const form = new URLSearchParams();
  form.append("secret", env.TURNSTILE_SECRET);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  return data.success === true;
}

async function sendVerificationEmail(to: string, link: string, env: Env) {
  const payload = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: env.EMAIL_SENDER || "no-reply@cybercrowd.net" },
    subject: "Verify your CyberCrowd account",
    content: [
      { type: "text/plain", value: `Verify your account: ${link}` },
      { type: "text/html", value: `<p>Click to verify your account:</p><p><a href="${link}">${link}</a></p>` }
    ]
  };

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return res.ok;
}

function generateToken(len = 32) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const hash = new Uint8Array(hashBuffer);
  return Array.from(salt).map(b => b.toString(16).padStart(2,"0")).join("") + 
         ":" + 
         Array.from(hash).map(b => b.toString(16).padStart(2,"0")).join("");
}

function json(data: any, status = 200, headers: HeadersInit = {}) {
  const h = new Headers(headers);
  h.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { status, headers: h });
}
