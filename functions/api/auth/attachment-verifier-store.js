/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: functions/api/auth/attachment-verifier-store.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Add attachment verifier store
 * CONTEXT:
 * Persist one already-built
 * attachment-verifier record
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
 */

export async function storeAttachmentVerifier(
  env,
  verifierRecord
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
    !verifierRecord ||
    typeof verifierRecord !== "object"
  ) {
    return {
      ok: false,
      key: null,
      reason:
        "ATTACHMENT_VERIFIER_RECORD_REQUIRED",
    };
  }

  const verifierId =
    String(
      verifierRecord.verifierId || ""
    ).trim();

  if (!verifierId) {
    return {
      ok: false,
      key: null,
      reason:
        "VERIFIER_ID_REQUIRED",
    };
  }

  const ownerAttachmentId =
    String(
      verifierRecord.ownerAttachmentId ||
      ""
    ).trim();

  if (!ownerAttachmentId) {
    return {
      ok: false,
      key: null,
      reason:
        "OWNER_ATTACHMENT_ID_REQUIRED",
    };
  }

  if (
    typeof verifierRecord.secretHash !==
      "string" ||
    !/^[a-f0-9]{64}$/i.test(
      verifierRecord.secretHash
    )
  ) {
    return {
      ok: false,
      key: null,
      reason:
        "VALID_VERIFIER_HASH_REQUIRED",
    };
  }

  if (
    !Number.isInteger(
      verifierRecord.failedAttemptCount
    ) ||
    verifierRecord.failedAttemptCount < 0 ||
    verifierRecord.failedAttemptCount > 3
  ) {
    return {
      ok: false,
      key: null,
      reason:
        "VALID_FAILURE_COUNT_REQUIRED",
    };
  }

  if (
    verifierRecord.lockState !== "OPEN" &&
    verifierRecord.lockState !== "CLOSED" &&
    verifierRecord.lockState !==
      "ESCALATED"
  ) {
    return {
      ok: false,
      key: null,
      reason:
        "VALID_LOCK_STATE_REQUIRED",
    };
  }

  const key =
    `attachment-verifier:${verifierId}`;

  await env.IDENTITY.put(
    key,
    JSON.stringify(verifierRecord)
  );

  return {
    ok: true,
    key,
    reason:
      "ATTACHMENT_VERIFIER_STORED",
  };
}
