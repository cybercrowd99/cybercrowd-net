// FILE ACTION: CREATE NEW FILE
// FILE: functions/api/auth/password-uidl-store.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Add single-write password uIDL store
// CONTEXT: Persist one already-bound uIDL password record
// to one canonical IDENTITY key.
// One KV.
// One key.
// One write.
// No route.
// No hashing.
// No binding.
// No email index.
// No USERS write.
// No session.
// No cookie.
// No setup-token handling.

// CyberCrowd Auth
// Password → uIDL Store
//
// ONE JOB:
//
// Persist one already-bound uIDL record
// to its canonical IDENTITY record.
//
// One rock.
// One object.
// One movement.
// One function.
// One entrance.
// One exit.
// One actual end.
//
// STORE != BIND
//
// STORE != HASH
//
// STORE != VERIFY
//
// STORE != SESSION
//
// STORE != COOKIE
//
// STORE != TOKEN CONSUMPTION
//
// STORE != PROFILE LANE
//
// This file does NOT:
//
// - create a password record
// - hash a password
// - verify a password
// - bind password to uIDL
// - create identity
// - create email indexes
// - write USERS
// - create sessions
// - create cookies
// - read setup tokens
// - delete setup tokens
// - route requests
// - verify Turnstile
//
// Entrance:
//
// env
// boundUidlRecord
//
// Exit:
//
// one IDENTITY.put()
// one user:<identity-active-id> key
//

export async function storePasswordBoundUidl(
  env,
  boundUidlRecord
) {
  if (!env?.IDENTITY) {
    return {
      ok: false,
      key: null,
      reason: "IDENTITY_STORE_REQUIRED"
    };
  }

  if (
    !boundUidlRecord ||
    typeof boundUidlRecord !== "object"
  ) {
    return {
      ok: false,
      key: null,
      reason: "BOUND_UIDL_RECORD_REQUIRED"
    };
  }

  const identityActiveId = String(
    boundUidlRecord["identity-active-id"] ||
    boundUidlRecord.identity_active_id ||
    boundUidlRecord.identityActiveId ||
    boundUidlRecord.identity_id ||
    boundUidlRecord.identityId ||
    ""
  ).trim();

  if (!identityActiveId) {
    return {
      ok: false,
      key: null,
      reason: "IDENTITY_ACTIVE_ID_REQUIRED"
    };
  }

  if (boundUidlRecord.passwordBound !== true) {
    return {
      ok: false,
      key: null,
      reason: "PASSWORD_UIDL_BINDING_REQUIRED"
    };
  }

  if (
    !boundUidlRecord.passwordRecord ||
    typeof boundUidlRecord.passwordRecord !== "object"
  ) {
    return {
      ok: false,
      key: null,
      reason: "PASSWORD_RECORD_REQUIRED"
    };
  }

  const key =
    `user:${identityActiveId}`;

  await env.IDENTITY.put(
    key,
    JSON.stringify(boundUidlRecord)
  );

  return {
    ok: true,
    key,
    reason: "PASSWORD_BOUND_UIDL_STORED"
  };
}
