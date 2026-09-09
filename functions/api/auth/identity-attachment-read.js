/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: functions/api/auth/identity-attachment-read.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Add runtime identity attachment read
 * CONTEXT:
 * Read one stored
 * uIDL identity-attachment record
 * from one canonical IDENTITY key.
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
 * No attachment creation.
 * No root creation.
 * No root comparison.
 * No verifier creation.
 * No verifier read.
 * No verifier comparison.
 * No failure calculation.
 * No lock calculation.
 * No escalation.
 * No password handling.
 * No session creation.
 * No relationship execution.
 * No capability execution.
 * No authorization.
 * No lane opening.
 */

export async function readIdentityAttachment(
  env,
  attachmentId
) {
  if (!env?.IDENTITY) {
    return {
      ok: false,
      record: null,
      reason:
        "IDENTITY_STORE_REQUIRED",
    };
  }

  const cleanAttachmentId =
    String(
      attachmentId || ""
    ).trim();

  if (!cleanAttachmentId) {
    return {
      ok: false,
      record: null,
      reason:
        "ATTACHMENT_ID_REQUIRED",
    };
  }

  const key =
    `identity-attachment:${cleanAttachmentId}`;

  const raw =
    await env.IDENTITY.get(key);

  if (!raw) {
    return {
      ok: false,
      record: null,
      reason:
        "IDENTITY_ATTACHMENT_NOT_FOUND",
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
        "IDENTITY_ATTACHMENT_CORRUPT",
    };
  }

  return {
    ok: true,
    record,
    reason:
      "IDENTITY_ATTACHMENT_FOUND",
  };
}
