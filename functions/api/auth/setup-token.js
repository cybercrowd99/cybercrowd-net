// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// functions/api/auth/setup-token.js
//
// LOCATION:
// CYBERCROWD-NET / FUNCTIONS / API / AUTH
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 EXPORTED FUNCTION
//
// JOB:
// Create one disposable setup token record
// for one verified CyberCrowd email.
//
// OWNS:
// Setup token creation.
// Identity-active-id creation.
// Token creation timestamp.
// 15-minute setup expiration.
// Initial pending_setup state.
// Initial unused state.
//
// OUTPUT:
// {
//   token,
//   identity-active-id,
//   email,
//   status,
//   used,
//   createdAt,
//   expiresAt
// }
//
// DOES NOT OWN:
// KV storage.
// Email sending.
// Email verification.
// Password creation.
// Password hashing.
// Session creation.
// Cookie creation.
// Routing.
// UI.
//
// ONE ROCK.
// ONE OBJECT.
// ONE MOVEMENT.
// ONE FUNCTION.
// ONE ENTRANCE.
// ONE EXIT.
// ONE ACTUAL END.

export function createSetupToken(email) {
  const token = crypto.randomUUID();

  const now = Date.now();
  const expiresAt = now + 900_000; // 900 seconds = 15 minutes

  return {
    token,
    "identity-active-id": crypto.randomUUID(),
    email,
    status: "pending_setup",
    used: false,
    createdAt: now,
    expiresAt
  };
}
