// setup-token.js
// CyberCrowd — Setup Token Creator
// JOB: Create a one-time setup token record.
// NO storage. NO Postmark. NO KV. NO UI.

export function createSetupToken(email) {
  if (typeof email !== "string" || email.trim().length === 0) {
    return null;
  }

  const trimmed = email.trim();

  // Simple, collision-resistant token generator
  const token = crypto.randomUUID();

  const record = {
    email: trimmed,
    token,
    createdAt: Date.now()
  };

  return record;
}
