/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: functions/api/auth/attachment-verifier-read.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Add attachment verifier record read
 * CONTEXT:
 * Read one stored
 * attachment-verifier record
 * from one canonical
 * IDENTITY key.
 *
 * One rock.
 * One object.
 * One movement.
 * One function.
 * One entrance.
 * One exit.
 * One actual end.
 *
 * No storage write.
 * No hash creation.
 * No hash comparison.
 * No failure calculation.
 * No lock calculation.
 * No escalation.
 * No root login.
 * No password handling.
 * No session creation.
 * No lane opening.
 * No authorization.
 * No external mutation.
 */

export async function readAttachmentVerifier(
  env,
  verifierId
) {
  if (!env?.IDENTITY) {
    return {
      ok: false,
      record: null,
      reason:
        "IDENTITY_STORE_REQUIRED",
    };
  }

  const cleanVerifierId =
    String(
      verifierId || ""
    ).trim();

  if (!cleanVerifierId) {
    return {
      ok: false,
      record: null,
      reason:
        "VERIFIER_ID_REQUIRED",
    };
  }

  const key =
    `attachment-verifier:${cleanVerifierId}`;

  const raw =
    await env.IDENTITY.get(key);

  if (!raw) {
    return {
      ok: false,
      record: null,
      reason:
        "ATTACHMENT_VERIFIER_NOT_FOUND",
    };
  }

  let record;

  try {
    record =
      JSON.parse(raw);
  } catch {
    return {
      ok: false,
      record: null,
      reason:
        "ATTACHMENT_VERIFIER_CORRUPT",
    };
  }

  return {
    ok: true,
    record,
    reason:
      "ATTACHMENT_VERIFIER_FOUND",
  };
}
