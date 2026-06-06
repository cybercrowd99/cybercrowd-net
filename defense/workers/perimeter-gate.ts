// workers/perimeter-gate.ts
export interface Env {
  TURNSTILE_SECRET_KEY: string;
  DEFENSE_DISPATCHER: Fetcher; // Service binding to organism-dispatcher Worker
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // Only gate paths you care about (auth surfaces, dashboard entry)
    if (!isProtectedPath(url.pathname)) {
      return fetch(request); // Pass through to origin/Pages
    }

    // 1. Read Bot Score (Enterprise Bot Management required)
    // @ts-ignore — cf properties
    const botScore = request.cf?.botManagement?.score ?? 99;
    const isVerifiedBot = request.cf?.botManagement?.verifiedBot ?? false;

    // Verified good bots (search engines) bypass
    if (isVerifiedBot) {
      return fetch(request);
    }

    // 2. Turnstile token extraction
    // For POSTs: form data. For GETs: query param (less secure, avoid if possible).
    let token: string | null = null;
    
    if (request.method === 'POST') {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await request.clone().json();
        token = json['cf-turnstile-response'] || null;
      } else {
        const formData = await request.clone().formData();
        token = formData.get('cf-turnstile-response') as string | null;
      }
    } else {
      token = url.searchParams.get('cf-turnstile-response');
    }

    // 3. If no token and bot score is suspicious, route to deception immediately
    if (!token && botScore < 30) {
      return env.DEFENSE_DISPATCHER.fetch(new Request(request.url, {
        method: 'POST',
        headers: {
          'X-Defense-Trigger': 'no-turnstile-token',
          'X-Bot-Score': String(botScore),
          'X-Original-Path': url.pathname,
        },
        body: JSON.stringify({
          ip: request.headers.get('CF-Connecting-IP'),
          ua: request.headers.get('User-Agent'),
          asn: request.cf?.asn,
          botScore,
          path: url.pathname,
          timestamp: Date.now(),
        }),
      }));
    }

    // 4. Validate Turnstile token via siteverify
    const verifyResult = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: request.headers.get('CF-Connecting-IP'),
      }),
    });

    const outcome = await verifyResult.json() as {
      success: boolean;
      'error-codes'?: string[];
      hostname?: string;
      action?: string;
      cdata?: string;
    };

    // 5. Turnstile passed + decent bot score → allow
    if (outcome.success && botScore >= 30) {
      // Strip token from request before forwarding to origin
      const cleanRequest = stripTurnstileToken(request, token);
      return fetch(cleanRequest);
    }

    // 6. Turnstile failed OR bot score still low → deception grid
    return env.DEFENSE_DISPATCHER.fetch(new Request(request.url, {
      method: 'POST',
      headers: {
        'X-Defense-Trigger': 'turnstile-fail-or-low-score',
        'X-Turnstile-Success': String(outcome.success),
        'X-Bot-Score': String(botScore),
        'X-Original-Path': url.pathname,
      },
      body: JSON.stringify({
        ip: request.headers.get('CF-Connecting-IP'),
        ua: request.headers.get('User-Agent'),
        asn: request.cf?.asn,
        botScore,
        turnstileSuccess: outcome.success,
        turnstileErrors: outcome['error-codes'] || [],
        path: url.pathname,
        timestamp: Date.now(),
      }),
    }));
  },
};

function isProtectedPath(path: string): boolean {
  return (
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/verify') ||
    path.startsWith('/dashboard') ||
    path.startsWith('/api/auth')
  );
}

function stripTurnstileToken(request: Request, token: string): Request {
  // Clone request without the turnstile token to prevent leaking it downstream
  const url = new URL(request.url);
  url.searchParams.delete('cf-turnstile-response');
  
  if (request.method === 'POST') {
    // For form posts, you'd need to reconstruct body without token
    // Simplified: pass through with header marking as verified
    const headers = new Headers(request.headers);
    headers.set('X-Turnstile-Verified', 'true');
    return new Request(url.toString(), { headers, method: request.method, body: request.body });
  }
  
  return new Request(url.toString(), request);
}
