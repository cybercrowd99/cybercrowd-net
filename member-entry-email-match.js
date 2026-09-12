// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// member-entry-email-match.js
//
// LOCATION:
// REPOSITORY ROOT / NET
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Send the Member Entry email
// to the existing returning-member
// identity matcher and wake the
// existing password lane.
//
// FUNCTION:
// requestMemberEntryEmailMatch()
//
// ENTRANCE:
// Member Entry email string
//
// REQUEST:
// /api/auth/returning-email-match
//
// PASS:
// Save cc_verified_email
//
// OUTPUT:
// cybercrowd:returning-password-required
//
// NEXT RECEIVER:
// returning-password-field.js
//
// DOES NOT OWN:
// Member Entry graphic.
// Email field rendering.
// Password field rendering.
// Password capture.
// Password verification.
// Password hashing.
// Password storage.
// Session creation.
// Cookie creation.
// uIDL.
// Profile.
// Routing.

export async function requestMemberEntryEmailMatch(
  email
) {
  const cleanEmail =
    String(
      email || ""
    )
      .trim()
      .toLowerCase();

  if (!cleanEmail) {
    return {
      success: false,
      matched: false,
      error: "email_missing"
    };
  }

  const response =
    await fetch(
      "/api/auth/returning-email-match",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          email: cleanEmail
        })
      }
    );

  const result =
    await response
      .json()
      .catch(() => null);

  if (
    !response.ok ||
    result?.success !== true ||
    result?.matched !== true ||
    !result?.identity_active_id
  ) {
    window.localStorage.removeItem(
      "cc_verified_email"
    );

    return {
      success: false,
      matched: false,
      error:
        result?.error ||
        "identity_not_found"
    };
  }

  window.localStorage.setItem(
    "cc_verified_email",
    cleanEmail
  );

  const {
    installReturningPasswordField
  } =
    await import(
      "./returning-password-field.js"
    );

  installReturningPasswordField();

  window.dispatchEvent(
    new CustomEvent(
      "cybercrowd:returning-password-required",
      {
        detail: {
          email: cleanEmail,
          identity_active_id:
            result.identity_active_id
        }
      }
    )
  );

  return {
    success: true,
    matched: true,
    email: cleanEmail,
    identity_active_id:
      result.identity_active_id
  };
}
