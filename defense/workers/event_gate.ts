export interface Env {
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_SITEKEY: string;
}

const COOKIE_NAME = '__event_marker';
const EVENT_MARKER_DURATION_MS = 60 * 60 * 1000; // 1 hour

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Quarter‑Check submission endpoint
    if (url.pathname === '/.event/quarter-check' && request.method === 'POST') {
      return handleQuarterCheck(request, env);
    }

    // Unprotected paths pass straight into the coliseum
    if (!isActionWindow(url.pathname)) {
      return fetch(request);
    }

    // Check for Event‑Marker (continuity token)
    const cookie = request.headers.get('Cookie');
    if (cookie && (await verifyEventMarker(cookie, env))) {
      return fetch(request);
    }

    // No marker → present Quarter‑Check arena
    return quarterCheckSurface(url, env);
  },
};

function isActionWindow(path: string): boolean {
  return (
    path.startsWith('/quarter-check') ||
    path.startsWith('/pinball') ||
    path.startsWith('/mailbox-fetch') ||
    path.startsWith('/keybind') ||
    path.startsWith('/return-ignition') ||
    path.startsWith('/vessel') ||
    path.startsWith('/api/pinball')
  );
}

async function handleQuarterCheck(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const redirect = url.searchParams.get('redirect') || '/vessel';

  const formData = await request.formData();
  const token = formData.get('cf-turnstile-response') as string | null;

  if (!token) {
    return quarterCheckSurface(new URL(redirect, url.origin), env, 'Quarter missing — try again.');
  }

  const valid = await verifyTurnstile(token, env, request);
  if (!valid) {
    return quarterCheckSurface(new URL(redirect, url.origin), env, 'Quarter rejected — try again.');
  }

  // Human presence confirmed → issue Event‑Marker
  const headers = new Headers();
  headers.set('Location', redirect);
  headers.append('Set-Cookie', await createEventMarker(env));
  return new Response(null, { status: 303, headers });
}

async function verifyTurnstile(token: string, env: Env, request: Request): Promise<boolean> {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP'),
    }),
  });
  const data = (await res.json()) as { success: boolean };
  return data.success;
}

function quarterCheckSurface(url: URL, env: Env, error?: string): Response {
  const sitekey = env.TURNSTILE_SITEKEY;
  if (!sitekey) {
    return new Response('Configuration error: TURNSTILE_SITEKEY not set', { status: 500 });
  }

  const redirect = encodeURIComponent(url.pathname + url.search);

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Quarter Check — Coliseum Gate</title>
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #050505; color: #e0e0e0; }
    .box { text-align: center; padding: 2.5rem; border: 1px solid #222; border-radius: 12px; background: #0f0f0f; max-width: 400px; width: 90%; }
    h2 { margin: 0 0 0.5rem; font-weight: 500; letter-spacing: -0.5px; }
    p { color: #888; margin: 0 0 1.5rem; font-size: 0.95rem; }
    .error { color: #ff5555; margin-bottom: 1rem; font-size: 0.9rem; }
    .cf-turnstile { display: inline-block; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="box">
    <h2>Quarter Check</h2>
    <p>Present your quarter to enter ${escapeHtml(url.pathname)}</p>
    ${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}
    <form method="POST" action="/.event/quarter-check?redirect=${redirect}">
      <div class="cf-turnstile" data-sitekey="${escapeHtml(sitekey)}" data-callback="onTurnstileSuccess"></div>
      <input type="hidden" name="cf-turnstile-response" id="ts-token">
    </form>
    <script>
      function onTurnstileSuccess(token) {
        document.getElementById('ts-token').value = token;
        document.querySelector('form').submit();
      }
    </script>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ---------- Event‑Marker helpers ---------- */

async function createEventMarker(env: Env): Promise<string> {
  const secret = env.TURNSTILE_SECRET_KEY;
  const timestamp = Date.now();
  const sig = await hmac(`${timestamp}`, secret);
  const value = `${timestamp}.${sig}`;
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`;
}

async function verifyEventMarker(cookieHeader: string, env: Env): Promise<boolean> {
  const secret = env.TURNSTILE_SECRET_KEY;
  const raw = getCookieValue(cookieHeader, COOKIE_NAME);
  if (!raw) return false;

  const parts = decodeURIComponent(raw).split('.');
  if (parts.length !== 2) return false;

  const [timestampStr, sig] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;
  if (Date.now() - timestamp > EVENT_MARKER_DURATION_MS) return false;

  const expected = await hmac(timestampStr, secret);
  return timingSafeEqual(sig, expected);
}

function getCookieValue(cookieHeader: string, name: string): string | null {
  for (const c of cookieHeader.split(';')) {
    const [key, ...rest] = c.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

async function hmac(message: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
