// FILE ACTION: CREATE NEW FILE
// FILE: functions/api/auth/uidl-email-index-read.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Add single-read uIDL email index lookup
// CONTEXT: Read one normalized email index
// from IDENTITY KV and return one identity-active-id.
// One KV.
// One key.
// One read.
// No password verification.
// No identity record read.
// No session.
// No cookie.
// No routing.

// CyberCrowd Auth
// uIDL Email Index Read
//
// ONE JOB:
//
// Read one email → identity-active-id lookup.
//
// One rock.
// One object.
// One movement.
// One function.
// One entrance.
// One exit.
// One actual end.
//
// EMAIL LOOKUP != IDENTITY RECORD READ
//
// EMAIL LOOKUP != PASSWORD VERIFY
//
// EMAIL LOOKUP != LOGIN
//
// EMAIL LOOKUP != SESSION
//
// EMAIL LOOKUP != AUTHORITY
//
// This file does NOT:
//
// - create identity
// - mutate identity
// - read the uIDL record
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
// email
//
// Exit:
//
// one IDENTITY.get()
// one identity-active-id
//

export async function readUidlEmailIndex(
  env,
  email
) {
  if (!env?.IDENTITY) {
    return {
      ok: false,
      identityActiveId: null,
      reason: "IDENTITY_STORE_REQUIRED"
    };
  }

  const normalizedEmail = String(
    email || ""
  )
    .trim()
    .toLowerCase();

  if (
    !normalizedEmail ||
    !normalizedEmail.includes("@")
  ) {
    return {
      ok: false,
      identityActiveId: null,
      reason: "VALID_EMAIL_REQUIRED"
    };
  }

  const key =
    `user-email:${normalizedEmail}`;

  const identityActiveId =
    await env.IDENTITY.get(key);

  if (!identityActiveId) {
    return {
      ok: false,
      identityActiveId: null,
      reason: "UIDL_EMAIL_INDEX_NOT_FOUND"
    };
  }

  return {
    ok: true,
    identityActiveId:
      String(identityActiveId).trim(),
    reason: "UIDL_EMAIL_INDEX_FOUND"
  };
}
