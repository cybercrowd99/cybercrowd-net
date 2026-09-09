/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: functions/api/auth/attachment-verifier-hash.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Add scoped attachment verifier hash
 * CONTEXT:
 * Derive one secure HMAC value
 * from one 4-digit attachment verifier.
 *
 * One job.
 * No storage.
 * No comparison.
 * No failed-attempt handling.
 * No lock handling.
 * No escalation.
 * No session creation.
 * No root password handling.
 * No authorization.
 */

export async function hashAttachmentVerifier(
  digits,
  ownerAttachmentId,
  secret
) {
  if (
    typeof digits !== "string" ||
    !/^\d{4}$/.test(digits)
  ) {
    throw new Error(
      "INVALID_ATTACHMENT_VERIFIER"
    );
  }

  if (
    typeof ownerAttachmentId !== "string" ||
    ownerAttachmentId.length === 0
  ) {
    throw new Error(
      "INVALID_ATTACHMENT_ID"
    );
  }

  if (
    typeof secret !== "string" ||
    secret.length === 0
  ) {
    throw new Error(
      "MISSING_ATTACHMENT_VERIFIER_SECRET"
    );
  }

  const encoder =
    new TextEncoder();

  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

  const scopedValue =
    [
      "UIDL_ATTACHMENT_VERIFIER_V1",
      ownerAttachmentId,
      digits,
    ].join("|");

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(scopedValue)
    );

  return Array
    .from(
      new Uint8Array(signature)
    )
    .map(
      byte =>
        byte
          .toString(16)
          .padStart(2, "0")
    )
    .join("");
}
