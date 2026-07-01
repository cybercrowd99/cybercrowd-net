// src/cybercrowd-turnstile-archive.ts
//
// CyberCrowd Turnstile Archive
//
// ONE JOB:
// Record Turnstile pass/fail observation.
//
// Turnstile Archive records observation.
// It does not verify Turnstile.
// It does not stop email sends.
// One-Time Pass stops repeat paid emails.
//
// DO NOT store raw Turnstile token.
// DO NOT store raw email.
// DO NOT store password.
// DO NOT store session.
// DO NOT store auth secret.

export interface CyberCrowdTurnstileArchiveKV {
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>;
}

export type CyberCrowdTurnstileResult = "success" | "failure";

export interface CyberCrowdTurnstilePassRecord {
  archive_id: string;
  key: string;
  email_hash: string;
  email_mask: string;
  turnstile_result: CyberCrowdTurnstileResult;
  site_key: string | null;
  ip_hash: string | null;
  user_agent_hash: string | null;
  created_at_ms: number;
}

export interface CyberCrowdTurnstileArchiveResult {
  ok: boolean;
  action: "turnstile_pass_archived" | "invalid_email" | "kv_missing";
  key: string | null;
  record: CyberCrowdTurnstilePassRecord | null;
  message: string;
}

export async function archiveCyberCrowdTurnstilePass(input: {
  kv: CyberCrowdTurnstileArchiveKV;
  email: string;
  turnstileResult: CyberCrowdTurnstileResult;
  siteKey?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  ttlSeconds?: number;
  nowMs?: number;
}): Promise<CyberCrowdTurnstileArchiveResult> {
  const kv = input.kv;

  if (!kv) {
    return fail("kv_missing", "CYBERCROWD_TURNSTILE_ARCHIVE KV is missing.");
  }

  const email = normalizeEmail(input.email);

  if (!email) {
    return fail("invalid_email", "Email is invalid.");
  }

  const nowMs = input.nowMs ?? Date.now();
  const ttlSeconds = input.ttlSeconds ?? 86400;

  const emailHash = await hashEmail(email);
  const key = makeTurnstilePassKey(emailHash, nowMs);

  const record: CyberCrowdTurnstilePassRecord = {
    archive_id: makeId("cc-turnstile"),
    key,
    email_hash: emailHash,
    email_mask: maskEmail(email),
    turnstile_result: input.turnstileResult,
    site_key: input.siteKey ?? null,
    ip_hash: input.ip ? await hashValue(input.ip) : null,
    user_agent_hash: input.userAgent ? await hashValue(input.userAgent) : null,
    created_at_ms: nowMs
  };

  await kv.put(key, JSON.stringify(record), {
    expirationTtl: ttlSeconds
  });

  return {
    ok: true,
    action: "turnstile_pass_archived",
    key,
    record,
    message: "Turnstile observation archived."
  };
}

export function makeTurnstilePassKey(
  emailHash: string,
  timestampMs: number
): string {
  return `turnstile:pass:${emailHash}:${timestampMs}`;
}

function fail(
  action: CyberCrowdTurnstileArchiveResult["action"],
  message: string
): CyberCrowdTurnstileArchiveResult {
  return {
    ok: false,
    action,
    key: null,
    record: null,
    message
  };
}

function normalizeEmail(value: string): string {
  const email = String(value || "").trim().toLowerCase();

  if (!email) return "";
  if (email.length > 254) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";

  return email;
}

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");

  if (!name || !domain) {
    return "unknown";
  }

  return `${name.slice(0, 2)}***@${domain}`;
}

async function hashEmail(email: string): Promise<string> {
  const data = new TextEncoder().encode(email.toLowerCase().trim());
  const digest = await crypto.subtle.digest("SHA-256", data);

  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashValue(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.toLowerCase().trim());
  const digest = await crypto.subtle.digest("SHA-256", data);

  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function makeId(prefix: string): string {
  if (crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
