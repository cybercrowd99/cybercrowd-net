// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-email-send-surface.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Create the Email + Send DOM surface inside .stage.
//
// FUNCTION:
// installEmailSendSurface()
//
// CREATES:
// .entry-form
// #email
// #sendButton
//
// DOES NOT OWN:
// Reveal behavior.
// Enable behavior.
// Email validation.
// Email transmission.
// Audio.
// Wheel movement.
// Movement #1.
// Movement #2.
// Movement #3.
// Turnstile rendering.
// Turnstile verification.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installEmailSendSurface() {
  const stage =
    document.querySelector(".stage");

  if (!stage) {
    return false;
  }

  if (
    document.getElementById("email") ||
    document.getElementById("sendButton")
  ) {
    return false;
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

  stage.appendChild(
    entryForm
  );

  return true;
}
