// FILE ACTION: CREATE NEW FILE
// FILE: functions/api/auth/password-uidl-binding.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Add password to uIDL binding organ
// CONTEXT: Bind one already-created canonical password record
// to one established uIDL record in memory.
// No KV write.
// No route.
// No token handling.
// No session.
// No cookie.
// No hashing.

// CyberCrowd Auth
// Password → uIDL Binding
//
// ONE JOB:
//
// Bind one canonical password record
// to one established uIDL record.
//
// One rock.
// One object.
// One movement.
// One function.
// One entrance.
// One exit.
// One actual end.
//
// PASSWORD != IDENTITY CREATION
//
// PASSWORD != STORAGE
//
// PASSWORD != SESSION
//
// PASSWORD != TURNSTILE
//
// PASSWORD != PROFILE LANE
//
// PASSWORD != AUTHORITY
//
// This file does NOT:
//
// - hash passwords
// - verify passwords
// - create password records
// - write KV
// - read KV
// - create identity
// - create sessions
// - create cookies
// - consume setup tokens
// - route requests
// - choose profile lanes
// - verify Turnstile
//
// It receives:
//
// 1. one established uIDL record
// 2. one canonical password record
//
// It returns:
//
// one uIDL record carrying
// that password record.
//
// No storage occurs here.
//

export function bindPasswordRecordToUidl(
  uidlRecord,
  passwordRecord
) {
  if (
    !uidlRecord ||
    typeof uidlRecord !== "object"
  ) {
    return {
      ok: false,
      record: null,
      reason: "UIDL_RECORD_REQUIRED"
    };
  }

  if (
    !passwordRecord ||
    typeof passwordRecord !== "object"
  ) {
    return {
      ok: false,
      record: null,
      reason: "PASSWORD_RECORD_REQUIRED"
    };
  }

  const identityActiveId = String(
    uidlRecord["identity-active-id"] ||
    uidlRecord.identity_active_id ||
    uidlRecord.identityActiveId ||
    uidlRecord.identity_id ||
    uidlRecord.identityId ||
    ""
  ).trim();

  if (!identityActiveId) {
    return {
      ok: false,
      record: null,
      reason: "IDENTITY_ACTIVE_ID_REQUIRED"
    };
  }

  const record = Object.freeze({
    ...uidlRecord,

    "identity-active-id":
      identityActiveId,

    passwordRecord,

    passwordBound: true
  });

  return {
    ok: true,
    record,
    reason: "PASSWORD_BOUND_TO_UIDL"
  };
}
