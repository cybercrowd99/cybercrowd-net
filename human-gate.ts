type GatePurpose =
  | "login"
  | "register"
  | "verify"
  | "vault"
  | "profile"
  | "cybercrowdjobs"
  | "paid-access"
  | "test";

type GateStatus =
  | "created"
  | "verified"
  | "expired"
  | "used"
  | "failed";

type GateRecord = {
  gateId: string;
  tokenHash: string;
  sessionId: string;
  purpose: GatePurpose;
  redirectTo: string;
  createdAt: number;
  expiresAt: number;
  usedAt: number | null;
  status: GateStatus;
};

type GateStartRequest = {
  sessionId?: string;
  purpose?: GatePurpose;
  redirectTo?: string;
};

type GateVerifyRequest = {
  gateId?: string;
  token?: string;
  sessionId?: string;
};

type KVLike = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

type Env = {
  HUMAN_GATE_TOKENS?: KVLike;
};

const TOKEN_TTL_SECONDS = 120;
const TOKEN_PREFIX = "human-gate:";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function badRequest(message: string): Response {
  return jsonResponse(
    {
      ok: false,
      error: message
    },
    400
  );
}

function unavailable(message: string): Response {
  return jsonResponse(
    {
      ok: false,
      error: message
    },
    503
  );
}

function isGatePurpose(value: unknown): value is GatePurpose {
  return (
    value === "login" ||
    value === "register" ||
    value === "verify" ||
    value === "vault" ||
    value === "profile" ||
    value === "cybercrowdjobs" ||
    value === "paid-access" ||
    value === "test"
  );
}

function safeRedirect(value: unknown): string {
  if (typeof value !== "string") {
    return "verify.html";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return "verify.html";
  }

  if (value.includes("..")) {
    return "verify.html";
  }

  return value || "verify.html";
}

function randomId(prefix: string): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);

  const encoded = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `${prefix}_${encoded}`;
}

async function sha256(value: string): Promise<string> {
  const input = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", input);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

async function createGate(request: Request, env: Env): Promise<Response> {
  if (!env.HUMAN_GATE_TOKENS) {
    return unavailable("Human Gate token store is not bound.");
  }

  const body = await readJson<GateStartRequest>(request);

  if (!body) {
    return badRequest("Missing JSON body.");
  }

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return badRequest("Missing sessionId.");
  }

  const purpose: GatePurpose = isGatePurpose(body.purpose) ? body.purpose : "test";

  const gateId = randomId("gate");
  const token = randomId("token");
  const tokenHash = await sha256(token);

  const now = Date.now();

  const record: GateRecord = {
    gateId,
    tokenHash,
    sessionId: body.sessionId,
    purpose,
    redirectTo: safeRedirect(body.redirectTo),
    createdAt: now,
    expiresAt: now + TOKEN_TTL_SECONDS * 1000,
    usedAt: null,
    status: "created"
  };

  await env.HUMAN_GATE_TOKENS.put(
    `${TOKEN_PREFIX}${gateId}`,
    JSON.stringify(record),
    {
      expirationTtl: TOKEN_TTL_SECONDS
    }
  );

  return jsonResponse({
    ok: true,
    gateId,
    token,
    purpose,
    expiresInSeconds: TOKEN_TTL_SECONDS,
    redirectTo: record.redirectTo
  });
}

async function verifyGate(request: Request, env: Env): Promise<Response> {
  if (!env.HUMAN_GATE_TOKENS) {
    return unavailable("Human Gate token store is not bound.");
  }

  const body = await readJson<GateVerifyRequest>(request);

  if (!body) {
    return badRequest("Missing JSON body.");
  }

  if (!body.gateId || typeof body.gateId !== "string") {
    return badRequest("Missing gateId.");
  }

  if (!body.token || typeof body.token !== "string") {
    return badRequest("Missing token.");
  }

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return badRequest("Missing sessionId.");
  }

  const key = `${TOKEN_PREFIX}${body.gateId}`;
  const stored = await env.HUMAN_GATE_TOKENS.get(key);

  if (!stored) {
    return jsonResponse(
      {
        ok: false,
        status: "failed",
        error: "Gate token not found or expired."
      },
      401
    );
  }

  const record = JSON.parse(stored) as GateRecord;
  const now = Date.now();

  if (record.usedAt || record.status === "used" || record.status === "verified") {
    return jsonResponse(
      {
        ok: false,
        status: "used",
        error: "Gate token was already used."
      },
      401
    );
  }

  if (now > record.expiresAt) {
    record.status = "expired";

    await env.HUMAN_GATE_TOKENS.put(key, JSON.stringify(record), {
      expirationTtl: 15
    });

    return jsonResponse(
      {
        ok: false,
        status: "expired",
        error: "Gate token expired."
      },
      401
    );
  }

  if (record.sessionId !== body.sessionId) {
    record.status = "failed";

    await env.HUMAN_GATE_TOKENS.put(key, JSON.stringify(record), {
      expirationTtl: 15
    });

    return jsonResponse(
      {
        ok: false,
        status: "failed",
        error: "Gate token session mismatch."
      },
      401
    );
  }

  const incomingHash = await sha256(body.token);

  if (incomingHash !== record.tokenHash) {
    record.status = "failed";

    await env.HUMAN_GATE_TOKENS.put(key, JSON.stringify(record), {
      expirationTtl: 15
    });

    return jsonResponse(
      {
        ok: false,
        status: "failed",
        error: "Gate token invalid."
      },
      401
    );
  }

  record.status = "verified";
  record.usedAt = now;

  await env.HUMAN_GATE_TOKENS.put(key, JSON.stringify(record), {
    expirationTtl: 30
  });

  return jsonResponse({
    ok: true,
    status: "verified",
    purpose: record.purpose,
    redirectTo: record.redirectTo
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/human-gate/start") {
      return createGate(request, env);
    }

    if (request.method === "POST" && url.pathname === "/api/human-gate/verify") {
      return verifyGate(request, env);
    }

    return jsonResponse(
      {
        ok: false,
        error: "CyberCrowd Human Gate endpoint not found."
      },
      404
    );
  }
};
