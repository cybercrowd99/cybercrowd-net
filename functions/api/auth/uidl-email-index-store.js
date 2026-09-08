// FILE ACTION: CREATE NEW FILE
// FILE: functions/api/auth/uidl-email-index-store.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Add single-write uIDL email index store
// CONTEXT: Persist one normalized email-to-uIDL lookup reference
// in IDENTITY KV.
// One KV.
// One key.
// One write.
// No password handling.
// No identity record write.
// No session.
// No cookie.
// No routing.

// CyberCrowd Auth
// uIDL Email Index Store
//
// ONE JOB:
//
// Persist one email → identity-active-id lookup.
//
// One rock.
// One object.
// One movement.
// One function.
// One entrance.
// One exit.
// One actual end.
//
// EMAIL INDEX != IDENTITY RECORD
//
// EMAIL INDEX != PASSWORD
//
// EMAIL INDEX != SESSION
//
// EMAIL INDEX != AUTHORITY
//
// EMAIL INDEX != PROFILE
//
// This file does NOT:
//
// - create identity
// - mutate the uIDL record
// - create or verify passwords
// - read passwords
// - write password records
// - create sessions
// - create cookies
// - consume setup tokens
// - route requests
// - verify Turnstile
// - write USERS
//
// Entrance:
//
// env
// email
// identityActiveId
//
// Exit:
//
// one IDENTITY.put()
// one user-email:<email> key
//

export async function storeUidlEmailIndex(
  env,
  email,
  identityActiveId
) {
  if (!env?.IDENTITY) {
    return {
      ok: false,
      key: null,
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
      key: null,
      reason: "VALID_EMAIL_REQUIRED"
    };
  }

  const cleanIdentityActiveId = String(
    identityActiveId || ""
  ).trim();

  if (!cleanIdentityActiveId) {
    return {
      ok: false,
      key: null,
      reason: "IDENTITY_ACTIVE_ID_REQUIRED"
    };
  }

  const key =
    `user-email:${normalizedEmail}`;

  await env.IDENTITY.put(
    key,
    cleanIdentityActiveId
  );

  return {
    ok: true,
    key,
    reason: "UIDL_EMAIL_INDEX_STORED"
  };
}
