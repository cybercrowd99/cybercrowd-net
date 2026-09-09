/**
 * FILE ACTION: CREATE NEW FILE
 * FILE: functions/api/auth/identity-attachment-root-match.js
 * REPO: cybercrowd99/cybercrowd-net
 * COMMIT: Add identity attachment root match
 * CONTEXT:
 * Compare one authenticated
 * session root identity reference
 * with one identity attachment
 * root uIDL reference.
 *
 * One rock.
 * One object.
 * One movement.
 * One function.
 * One entrance.
 * One exit.
 * One actual end.
 *
 * No session read.
 * No attachment read.
 * No verifier read.
 * No verifier comparison.
 * No password verification.
 * No storage.
 * No mutation.
 * No capability execution.
 * No relationship execution.
 * No authorization.
 * No lane opening.
 */

/**
 * Compare:
 *
 * authenticated session
 * identity-active-id
 *
 * against:
 *
 * identity attachment
 * rootUidl
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
 * MATCH only proves that the
 * attachment resolves to the
 * same root identity represented
 * by the authenticated session.
 */
export function matchIdentityAttachmentRoot(
  sessionIdentityActiveId,
  attachmentRootUidl
) {
  const sessionRoot =
    String(
      sessionIdentityActiveId || ""
    ).trim();

  const attachmentRoot =
    String(
      attachmentRootUidl || ""
    ).trim();

  if (
    !sessionRoot ||
    !attachmentRoot
  ) {
    return false;
  }

  return (
    sessionRoot ===
    attachmentRoot
  );
}
