/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: functions/api/auth/attachment-verifier-attempt.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Connect authenticated attachment verifier attempt
 * CONTEXT:
 * Execute one complete
 * attachment-verifier attempt
 * beneath one already-authenticated
 * root identity.
 *
 * One rock.
 * One object.
 * One movement.
 * One function.
 * One entrance.
 * One exit.
 * One actual end.
 *
 * Uses existing rocks.
 *
 * No session creation.
 * No session-cookie reading.
 * No root password verification.
 * No attachment creation.
 * No verifier creation.
 * No hash implementation.
 * No capability execution.
 * No relationship execution.
 * No lane opening.
 * No authority grant.
 * No success-state reset policy.
 */

import {
  readIdentityAttachment,
} from "./identity-attachment-read.js";

import {
  matchIdentityAttachmentRoot,
} from "./identity-attachment-root-match.js";

import {
  readAttachmentVerifier,
} from "./attachment-verifier-read.js";

import {
  matchAttachmentVerifierOwner,
} from "./attachment-verifier-owner-match.js";

import {
  verifyAttachmentVerifier,
} from "./attachment-verifier-verify.js";

import {
  advanceAttachmentVerifierFailure,
} from "./attachment-verifier-failure-state.js";

import {
  storeAttachmentVerifier,
} from "./attachment-verifier-store.js";

/**
 * Process exactly one verifier attempt.
 *
 * Required entrance:
 *
 * env
 *
 * sessionIdentityActiveId
 *
 * attachmentId
 *
 * verifierId
 *
 * digits
 *
 * secret
 *
 * sessionIdentityActiveId must come
 * from an already-authenticated
 * root session.
 *
 * This function does not establish
 * or authenticate that session.
 */
export async function attemptAttachmentVerifier(
  env,
  {
    sessionIdentityActiveId,
    attachmentId,
    verifierId,
    digits,
    secret,
  }
) {
  const cleanSessionIdentityActiveId =
    String(
      sessionIdentityActiveId || ""
    ).trim();

  if (!cleanSessionIdentityActiveId) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "AUTHENTICATED_ROOT_REQUIRED",
    };
  }

  const cleanAttachmentId =
    String(
      attachmentId || ""
    ).trim();

  if (!cleanAttachmentId) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "ATTACHMENT_ID_REQUIRED",
    };
  }

  const cleanVerifierId =
    String(
      verifierId || ""
    ).trim();

  if (!cleanVerifierId) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "VERIFIER_ID_REQUIRED",
    };
  }

  if (
    typeof digits !== "string" ||
    !/^\d{4}$/.test(digits)
  ) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "INVALID_ATTACHMENT_VERIFIER",
    };
  }

  if (
    typeof secret !== "string" ||
    secret.length === 0
  ) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "ATTACHMENT_VERIFIER_SECRET_REQUIRED",
    };
  }

  const attachmentResult =
    await readIdentityAttachment(
      env,
      cleanAttachmentId
    );

  if (!attachmentResult.ok) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        attachmentResult.reason,
    };
  }

  const attachment =
    attachmentResult.record;

  const rootMatches =
    matchIdentityAttachmentRoot(
      cleanSessionIdentityActiveId,
      attachment.rootUidl
    );

  if (!rootMatches) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "IDENTITY_ATTACHMENT_ROOT_MISMATCH",
    };
  }

  const attachmentVerifierReference =
    String(
      attachment.verifierReference || ""
    ).trim();

  if (
    attachmentVerifierReference &&
    attachmentVerifierReference !==
      cleanVerifierId
  ) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "ATTACHMENT_VERIFIER_REFERENCE_MISMATCH",
    };
  }

  const verifierResult =
    await readAttachmentVerifier(
      env,
      cleanVerifierId
    );

  if (!verifierResult.ok) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        verifierResult.reason,
    };
  }

  const verifier =
    verifierResult.record;

  if (
    String(
      verifier.verifierId || ""
    ).trim() !== cleanVerifierId
  ) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "VERIFIER_RECORD_ID_MISMATCH",
    };
  }

  const ownerMatches =
    matchAttachmentVerifierOwner(
      cleanAttachmentId,
      verifier.ownerAttachmentId
    );

  if (!ownerMatches) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "ATTACHMENT_VERIFIER_OWNER_MISMATCH",
    };
  }

  if (
    verifier.lockState === "ESCALATED"
  ) {
    return {
      ok: false,
      matched: false,
      escalated: true,
      reason:
        "ATTACHMENT_VERIFIER_ESCALATED",
    };
  }

  if (
    verifier.lockState !== "OPEN"
  ) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "ATTACHMENT_VERIFIER_CLOSED",
    };
  }

  if (
    !Number.isInteger(
      verifier.failedAttemptCount
    ) ||
    verifier.failedAttemptCount < 0 ||
    verifier.failedAttemptCount > 2
  ) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "ATTACHMENT_VERIFIER_STATE_INVALID",
    };
  }

  if (
    typeof verifier.secretHash !==
      "string" ||
    !/^[a-f0-9]{64}$/i.test(
      verifier.secretHash
    )
  ) {
    return {
      ok: false,
      matched: false,
      escalated: false,
      reason:
        "ATTACHMENT_VERIFIER_HASH_INVALID",
    };
  }

  const matched =
    await verifyAttachmentVerifier(
      digits,
      verifier.ownerAttachmentId,
      secret,
      verifier.secretHash
    );

  if (matched) {
    return {
      ok: true,
      matched: true,
      escalated: false,
      reason:
        "ATTACHMENT_VERIFIER_MATCH",
    };
  }

  const nextFailureState =
    advanceAttachmentVerifierFailure(
      verifier.failedAttemptCount
    );

  const updatedVerifier =
    Object.freeze({
      ...verifier,

      failedAttemptCount:
        nextFailureState.failedAttemptCount,

      lockState:
        nextFailureState.lockState,
    });

  const storeResult =
    await storeAttachmentVerifier(
      env,
      updatedVerifier
    );

  if (!storeResult.ok) {
    return {
      ok: false,
      matched: false,
      escalated:
        nextFailureState.lockState ===
        "ESCALATED",
      reason:
        "ATTACHMENT_VERIFIER_FAILURE_STATE_NOT_STORED",
    };
  }

  if (
    nextFailureState.lockState ===
    "ESCALATED"
  ) {
    return {
      ok: true,
      matched: false,
      escalated: true,
      reason:
        "ATTACHMENT_VERIFIER_ESCALATED",
    };
  }

  return {
    ok: true,
    matched: false,
    escalated: false,
    reason:
      "ATTACHMENT_VERIFIER_NO_MATCH",
  };
}
