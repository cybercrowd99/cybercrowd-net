/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: functions/api/auth/attachment-verifier-failure-state.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Add attachment verifier failure state transition
 * CONTEXT:
 * Derive the next local verifier
 * failure count and lock state
 * after exactly one failed
 * verifier comparison.
 *
 * One rock.
 * One object.
 * One movement.
 * One function.
 * One entrance.
 * One exit.
 * One actual end.
 *
 * No storage.
 * No hash creation.
 * No verifier comparison.
 * No root login.
 * No session creation.
 * No password handling.
 * No lane opening.
 * No authorization.
 * No external mutation.
 */

/**
 * Record the state consequence
 * of exactly one failed
 * attachment-verifier attempt.
 *
 * Attempt 1:
 *
 * failedAttemptCount = 1
 * lockState = OPEN
 *
 * Attempt 2:
 *
 * failedAttemptCount = 2
 * lockState = OPEN
 *
 * Attempt 3:
 *
 * failedAttemptCount = 3
 * lockState = ESCALATED
 *
 * ESCALATED means the ordinary
 * four-digit verifier path
 * may no longer continue.
 *
 * This function does not perform
 * the stronger-proof escalation.
 *
 * It only declares that the local
 * verifier reached that state.
 */
export function advanceAttachmentVerifierFailure(
  failedAttemptCount
) {
  if (
    !Number.isInteger(failedAttemptCount) ||
    failedAttemptCount < 0 ||
    failedAttemptCount > 2
  ) {
    throw new Error(
      "INVALID_ATTACHMENT_VERIFIER_FAILURE_COUNT"
    );
  }

  const nextFailedAttemptCount =
    failedAttemptCount + 1;

  const lockState =
    nextFailedAttemptCount >= 3
      ? "ESCALATED"
      : "OPEN";

  return Object.freeze({
    failedAttemptCount:
      nextFailedAttemptCount,

    lockState,
  });
}
