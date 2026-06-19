// CyberCrowd Setup Token Helper
// Owns: creation of one-time opaque setup token with 900-second expiry.
// Does NOT own: KV writes, email sending, verification, password hashing, session, cookie.

export function createSetupToken(email) {
  const token = crypto.randomUUID();

  const now = Date.now();
  const expiresAt = now + 900_000; // 900 seconds = 15 minutes

  return {
    token,
    email,
    createdAt: now,
    expiresAt
  };
}
