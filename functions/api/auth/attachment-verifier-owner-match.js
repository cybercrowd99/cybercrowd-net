/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: functions/api/auth/attachment-verifier-owner-match.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Add attachment verifier owner match
 * CONTEXT:
 * Compare one selected
 * identity attachment ID
 * with one verifier record's
 * owner attachment ID.
 *
 * One rock.
 * One object.
 * One movement.
 * One function.
 * One entrance.
 * One exit.
 * One actual end.
 *
 * No attachment read.
 * No verifier read.
 * No root comparison.
 * No hash creation.
 * No verifier comparison.
 * No failure calculation.
 * No lock calculation.
 * No storage.
 * No mutation.
 * No password handling.
 * No session handling.
 * No authorization.
 * No lane opening.
 */

/**
 * Compare:
 *
 * selected identity attachment
 * attachmentId
 *
 * against:
 *
 * verifier record
 * ownerAttachmentId
 *
 * Returns only:
 *
 * true
 *
 * or
 *
 * false
 *
 * MATCH does not grant access.
 *
 * MATCH only proves that
 * this verifier belongs
 * to this attachment.
 */
export function matchAttachmentVerifierOwner(
  attachmentId,
  verifierOwnerAttachmentId
) {
  const selectedAttachmentId =
    String(
      attachmentId || ""
    ).trim();

  const ownerAttachmentId =
    String(
      verifierOwnerAttachmentId || ""
    ).trim();

  if (
    !selectedAttachmentId ||
    !ownerAttachmentId
  ) {
    return false;
  }

  return (
    selectedAttachmentId ===
    ownerAttachmentId
  );
}
