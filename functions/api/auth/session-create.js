import { saveSessionRecord } from "./user-store.js";

export function makeToken(bytes = 32) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);

  return [...array]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function makeEatCookie(eat, ttlSeconds = 86400 * 7) {
  return `EAT=${eat}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ttlSeconds}`;
}

export async function createSession(env, email, options = {}) {
  const ttlSeconds = options.ttlSeconds || 86400 * 7;
  const now = Date.now();
  const eat = makeToken(32);

  const sessionRecord = {
    eat,
    email: String(email || "").trim().toLowerCase(),
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
