// FILE ACTION: CREATE NEW FILE
// FILE: functions/api/auth/uidl-record-read.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Add single-read uIDL record lookup
// CONTEXT: Read one canonical uIDL record
// from IDENTITY KV by identity-active-id.
// One KV.
// One key.
// One read.
// No email lookup.
// No password verification.
// No session.
// No cookie.
// No routing.

// CyberCrowd Auth
// uIDL Record Read
//
// ONE JOB:
//
// Read one canonical uIDL record
// by identity-active-id.
//
// One rock.
// One object.
// One movement.
// One function.
// One entrance.
// One exit.
// One actual end.
//
// UIDL READ != EMAIL LOOKUP
//
// UIDL READ != PASSWORD VERIFY
//
// UIDL READ != SESSION
//
// UIDL READ != AUTHORITY
//
// UIDL READ != PROFILE LANE
//
// This file does NOT:
//
// - create identity
// - mutate identity
// - read an email index
// - create or verify passwords
// - create sessions
// - create cookies
// - consume setup tokens
// - route requests
// - verify Turnstile
// - write KV
//
// Entrance:
//
// env
// identityActiveId
//
// Exit:
//
// one IDENTITY.get()
// one uIDL record
//

export async function readUidlRecord(
  env,
  identityActiveId
) {
  if (!env?.IDENTITY) {
    return {
      ok: false,
      record: null,
      reason: "IDENTITY_STORE_REQUIRED"
    };
  }

  const cleanIdentityActiveId = String(
    identityActiveId || ""
  ).trim();

  if (!cleanIdentityActiveId) {
    return {
      ok: false,
      record: null,
      reason: "IDENTITY_ACTIVE_ID_REQUIRED"
    };
  }

  const key =
    `user:${cleanIdentityActiveId}`;

  const raw =
    await env.IDENTITY.get(key);

  if (!raw) {
    return {
      ok: false,
      record: null,
      reason: "UIDL_RECORD_NOT_FOUND"
    };
  }

  let record;

  try {
    record = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      record: null,
      reason: "UIDL_RECORD_CORRUPT"
    };
  }

  return {
    ok: true,
    record,
    reason: "UIDL_RECORD_FOUND"
  };
}
