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
// Create the Enter Email + Send human-action surface
// inside the Sequence #3 glass plaque.
//
// FUNCTION:
// installEmailSendSurface()
//
// INPUT:
// cybercrowd:face-two-arrived
//
// FLOW:
// ENTER YOUR EMAIL HERE
// -> human click
// -> same-size blank email surface
// -> human types
// -> SEND remains next human action
//
// CREATES:
// .entry-form
// #email-invite
// #email
// #sendButton
//
// PARENT:
// .glass-plaque-three
//
// DOES NOT OWN:
// Email validation.
// Email transmission.
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
        document.getElementById("email-invite") ||
        document.getElementById("email") ||
        document.getElementById("sendButton")
      ) {
        return;
      }

      const entryForm =
        document.createElement("div");

      entryForm.className =
        "entry-form";

      const emailInvite =
        document.createElement("button");

      emailInvite.id =
        "email-invite";

      emailInvite.className =
        "email-field";

      emailInvite.type =
        "button";

      emailInvite.textContent =
        "ENTER YOUR EMAIL HERE";

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

      email.autocapitalize =
        "none";

      email.spellcheck =
        false;

      email.placeholder =
        "";

      email.hidden =
        true;

      const sendButton =
        document.createElement("button");

      sendButton.id =
        "sendButton";

      sendButton.type =
        "button";

      sendButton.textContent =
        "SEND";

      sendButton.disabled =
        true;

      sendButton.setAttribute(
        "aria-disabled",
        "true"
      );

      emailInvite.addEventListener(
        "click",
        () => {
          emailInvite.hidden =
            true;

          email.hidden =
            false;

          email.focus();
        },
        { once: true }
      );

      email.addEventListener(
        "input",
        () => {
          const hasValue =
            email.value.trim().length > 0;

          sendButton.disabled =
            !hasValue;

          sendButton.setAttribute(
            "aria-disabled",
            hasValue ? "false" : "true"
          );
        }
      );

      entryForm.append(
        emailInvite,
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
