import { saveSessionRecord } from "./user-store.js";
import { makeEatCookie } from "./cookie.js";

export function makeToken(bytes = 32) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);

  return [...array]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSession(env, identityActiveId, options = {}) {
  const ttlSeconds = options.ttlSeconds || 86400 * 7;
  const now = Date.now();
  const eat = makeToken(32);

  const cleanIdentityActiveId = String(identityActiveId || "").trim();
  const email = String(options.email || "").trim().toLowerCase();

  if (!cleanIdentityActiveId) {
    throw new Error("identity_active_id_missing");
  }

  const sessionRecord = {
    eat,
    "identity-active-id": cleanIdentityActiveId,
    email,
    epoch: now,
    band: options.band || "user",
    createdAt: now,
    expiresAt: now + ttlSeconds * 1000
  };

  await saveSessionRecord(env, eat, sessionRecord, ttlSeconds);

  return {
    eat,
    sessionRecord,
    cookie: makeEatCookie(eat, ttlSeconds)
  };
}
