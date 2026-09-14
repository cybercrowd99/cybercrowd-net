// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// functions/api/auth/setup-token-store.js
//
// LOCATION:
// CYBERCROWD-NET / FUNCTIONS / API / AUTH
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 3 EXPORTED STORAGE OPERATIONS
//
// JOB:
// Own setup-token storage custody.
//
// OWNS:
// Write one setup:<token> record to IDENTITY.
// Read one setup:<token> record from IDENTITY.
// Delete one setup:<token> record from IDENTITY.
//
// STORAGE AUTHORITY:
// env.IDENTITY
//
// KEY CONTRACT:
// setup:${token}
//
// INPUT CONTRACT:
// storeSetupToken(env, key, record)
// readSetupToken(env, key)
// deleteSetupToken(env, key)
//
// OUTPUT CONTRACT:
// storeSetupToken() -> no payload
// readSetupToken() -> parsed record or null
// deleteSetupToken() -> no payload
//
// CALLED BY:
// functions/api/auth/send-verification.js
// functions/api/auth/verify.js
//
// DOES NOT OWN:
// Setup-token creation.
// Email sending.
// Email verification policy.
// Password creation.
// Password hashing.
// Password verification.
// Identity creation.
// Session creation.
// Cookie creation.
// Routing.
// UI.
// Turnstile.
// Human verification.
//
// FAILURE BOUNDARY:
// If this file is absent, any local Pages Function importing
// ./setup-token-store.js will fail at build time.
//
// ONE ROCK.
// ONE OBJECT.
// ONE MOVEMENT.
// ONE FUNCTIONAL CUSTODY.
// ONE ENTRANCE.
// ONE EXIT.
// ONE ACTUAL END.

export async function storeSetupToken(env, key, record) {
  await env.IDENTITY.put(key, JSON.stringify(record), {
    expiration: Math.floor(record.expiresAt / 1000)
  });
}

export async function readSetupToken(env, key) {
  const raw = await env.IDENTITY.get(key);
  return raw ? JSON.parse(raw) : null;
}

export async function deleteSetupToken(env, key) {
  await env.IDENTITY.delete(key);
}
