// FILE ACTION: CREATE NEW FILE
// FILE: functions/api/auth/uidl-password-verify.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Add canonical uIDL password verification organ
// CONTEXT: Verify one supplied password
// against one already-loaded uIDL passwordRecord
// using the existing canonical password-hash organ.
// No KV.
// No email lookup.
// No session.
// No cookie.
// No routing.
// No password creation.

// CyberCrowd Auth
// uIDL Password Verify
//
// ONE JOB:
//
// Verify one supplied password
// against one canonical password record
// already attached to one uIDL record.
//
// One rock.
// One object.
// One movement.
// One function.
// One entrance.
// One exit.
// One actual end.
//
// VERIFY != LOOKUP
//
// VERIFY != STORAGE
//
// VERIFY != PASSWORD CREATION
//
// VERIFY != SESSION
//
// VERIFY != COOKIE
//
// VERIFY != AUTHORITY
//
// VERIFY != PROFILE LANE
//
// This file does NOT:
//
// - read KV
// - write KV
// - find an email
// - find a uIDL
// - create a password record
// - change a password
// - create identity
// - create sessions
// - create cookies
// - consume tokens
// - route requests
// - verify Turnstile
//
// Canonical password mathematics belong to:
//
// functions/api/auth/password-hash.js
//

import {
  verifyPassword
} from "./password-hash.js";

export async function verifyUidlPassword(
  uidlRecord,
  suppliedPassword
) {
  if (
    !uidlRecord ||
    typeof uidlRecord !== "object"
  ) {
    return {
      ok: false,
      matched: false,
      reason: "UIDL_RECORD_REQUIRED"
    };
  }

  if (
    typeof suppliedPassword !== "string" ||
    !suppliedPassword
  ) {
    return {
      ok: false,
      matched: false,
      reason: "PASSWORD_REQUIRED"
    };
  }

  const passwordRecord =
    uidlRecord.passwordRecord;

  if (
    !passwordRecord ||
    typeof passwordRecord !== "object"
  ) {
    return {
      ok: false,
      matched: false,
      reason: "PASSWORD_RECORD_REQUIRED"
    };
  }

  const matched =
    await verifyPassword(
      suppliedPassword,
      passwordRecord
    );

  return {
    ok: true,
    matched,
    reason: matched
      ? "PASSWORD_MATCH"
      : "PASSWORD_NO_MATCH"
  };
}
