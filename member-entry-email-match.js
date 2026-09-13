// CYBERCROWD
//
// FILE:
// member-entry-email-match.js
//
// LAW:
// JS = SEPARATE FUNCTION
//
// JOB:
// Send one email to the existing
// returning-member matcher
// and return its answer.
//
// DOES NOT OWN:
// LOCAL STORAGE.
// PASSWORD.
// PASSWORD FIELD.
// EVENTS.
// PROJECTION.
// ROUTING.

export async function requestMemberEntryEmailMatch(
  email
) {
  const cleanEmail =
    String(email || "")
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

        body:
          JSON.stringify({
            email: cleanEmail
          })
      }
    );

  const result =
    await response
      .json()
      .catch(() => null);

  return {
    success:
      response.ok &&
      result?.success === true,

    matched:
      result?.matched === true,

    email:
      cleanEmail,

    identity_active_id:
      result?.identity_active_id || null,

    error:
      result?.error || null
  };
}
