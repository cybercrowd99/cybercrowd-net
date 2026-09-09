/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: functions/api/auth/attachment-verifier-verify.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Add scoped attachment verifier comparison
 * CONTEXT:
 * Compare one entered 4-digit
 * attachment verifier against
 * one saved scoped verifier hash.
 *
 * One job.
 * No storage.
 * No failed-attempt counting.
 * No lock mutation.
 * No escalation.
 * No session creation.
 * No root login.
 * No password handling.
 * No authorization.
 * No lane opening.
 */

import {
  hashAttachmentVerifier,
} from "./attachment-verifier-hash.js";

/**
 * Constant-time string comparison.
 *
 * This function does not interpret
 * the result beyond equality.
 */
function safeEqual(
  left,
  right
) {
  if (
    typeof left !== "string" ||
    typeof right !== "string"
  ) {
    return false;
  }

  if (
    left.length !== right.length
  ) {
    return false;
  }

  let difference = 0;

  for (
    let index = 0;
    index < left.length;
    index += 1
  ) {
    difference |=
      left.charCodeAt(index) ^
      right.charCodeAt(index);
  }

  return difference === 0;
}

/**
 * Verify one scoped attachment verifier.
 *
 * Returns only:
 *
 * true
 * false
 *
 * It does not:
 *
 * - grant access
 * - open a lane
 * - authenticate root identity
 * - establish a session
 * - increment failure count
 * - close a verifier
 * - escalate a verifier
 * - mutate a verifier record
 */
export async function verifyAttachmentVerifier(
  digits,
  ownerAttachmentId,
  secret,
  storedHash
) {
  if (
    typeof storedHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(storedHash)
  ) {
    return false;
  }

  const attemptedHash =
    await hashAttachmentVerifier(
      digits,
      ownerAttachmentId,
      secret
    );

  return safeEqual(
    attemptedHash,
    storedHash
  );
}
