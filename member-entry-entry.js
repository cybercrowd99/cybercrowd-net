// CYBERCROWD
//
// FILE:
// member-entry-entry.js
//
// ROLE:
// MEMBER ENTRY PROGRAM
//
// LAW:
// ENTRY = PROGRAM
//
// JOB:
// Operate the Member Entry art
// using separated functions.
//
// DOES NOT OWN:
// ART.
// CSS.
// IDENTITY AUTHORITY.
// PASSWORD.
// PROJECTION ART.

import {
  requestMemberEntryEmailMatch
} from "./member-entry-email-match.js";

const form =
  document.getElementById(
    "member-entry-email-form"
  );

const emailInput =
  document.getElementById(
    "member-entry-email"
  );

if (
  form &&
  emailInput
) {
  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      const email =
        String(
          emailInput.value || ""
        )
          .trim()
          .toLowerCase();

      if (!email) {
        return;
      }

      emailInput.disabled = true;

      try {
        const result =
          await requestMemberEntryEmailMatch(
            email
          );

        if (
          result.success !== true ||
          result.matched !== true ||
          !result.identity_active_id
        ) {
          emailInput.disabled = false;
          emailInput.select();
          return;
        }

        form.remove();

        window.dispatchEvent(
          new CustomEvent(
            "cybercrowd:member-entry-known-registrant",
            {
              detail: {
                email:
                  result.email,

                identity_active_id:
                  result.identity_active_id
              }
            }
          )
        );

      } catch {
        emailInput.disabled = false;
        emailInput.focus();
      }
    }
  );

  emailInput.focus();
}
