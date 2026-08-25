// CYBERCROWD
//
// FILE:
// create-account-email-send-surface.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #3
//
// JOB:
// Create the Email + Send DOM surface
// inside the Sequence #3 glass plaque.
//
// FUNCTION:
// installEmailSendSurface()
//
// INPUT:
// cybercrowd:face-two-arrived
//
// CREATES:
// .entry-form
// #email
// #sendButton
//
// PARENT:
// .glass-plaque-three
//
// DOES NOT OWN:
// Email validation.
// Email transmission.
// Send behavior.
// Turnstile.
// Verification.
// Movement.
// Rotation.
// Audio.
// WHOOSH.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installEmailSendSurface() {
  window.addEventListener(
    "cybercrowd:face-two-arrived",
    () => {
      const plaque =
        document.querySelector(
          ".glass-plaque-three"
        );

      if (!plaque) {
        return;
      }

      if (
        document.getElementById("email") ||
        document.getElementById("sendButton")
      ) {
        return;
      }

      const entryForm =
        document.createElement("div");

      entryForm.className =
        "entry-form";

      const email =
        document.createElement("input");

      email.id =
        "email";

      email.className =
        "email-field";

      email.type =
        "email";

      email.name =
        "email";

      email.autocomplete =
        "email";

      email.placeholder =
        "Email";

      email.disabled =
        true;

      email.setAttribute(
        "aria-disabled",
        "true"
      );

      const sendButton =
        document.createElement("button");

      sendButton.id =
        "sendButton";

      sendButton.type =
        "button";

      sendButton.textContent =
        "Send";

      sendButton.disabled =
        true;

      sendButton.setAttribute(
        "aria-disabled",
        "true"
      );

      entryForm.append(
        email,
        sendButton
      );

      plaque.appendChild(
        entryForm
      );
    },
    { once: true }
  );

  return true;
}
