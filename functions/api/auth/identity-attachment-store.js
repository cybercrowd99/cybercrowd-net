/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: functions/api/auth/identity-attachment-store.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Add runtime identity attachment store
 * CONTEXT:
 * Persist one already-built
 * uIDL identity attachment
 * to one canonical IDENTITY key.
 *
 * One rock.
 * One object.
 * One movement.
 * One function.
 * One entrance.
 * One exit.
 * One actual end.
 *
 * No attachment creation.
 * No root creation.
 * No verifier creation.
 * No verifier comparison.
 * No password handling.
 * No session creation.
 * No relationship execution.
 * No capability execution.
 * No authorization.
 * No lane opening.
 */

export async function storeIdentityAttachment(
  env,
  attachmentRecord
) {
  if (!env?.IDENTITY) {
    return {
      ok: false,
      key: null,
      reason:
        "IDENTITY_STORE_REQUIRED",
    };
  }

  if (
    !attachmentRecord ||
    typeof attachmentRecord !== "object"
  ) {
    return {
      ok: false,
      key: null,
      reason:
        "IDENTITY_ATTACHMENT_RECORD_REQUIRED",
    };
  }

  const attachmentId =
    String(
      attachmentRecord.attachmentId || ""
    ).trim();

  if (!attachmentId) {
    return {
      ok: false,
      key: null,
      reason:
        "ATTACHMENT_ID_REQUIRED",
    };
  }

  const rootUidl =
    String(
      attachmentRecord.rootUidl || ""
    ).trim();

  if (!rootUidl) {
    return {
      ok: false,
      key: null,
      reason:
        "ROOT_UIDL_REQUIRED",
    };
  }

  if (
    attachmentRecord.status !==
      "UIDL_IDENTITY_ATTACHMENT"
  ) {
    return {
      ok: false,
      key: null,
      reason:
        "VALID_IDENTITY_ATTACHMENT_REQUIRED",
    };
  }

  const key =
    `identity-attachment:${attachmentId}`;

  await env.IDENTITY.put(
    key,
    JSON.stringify(attachmentRecord)
  );

  return {
    ok: true,
    key,
    reason:
      "IDENTITY_ATTACHMENT_STORED",
  };
}
