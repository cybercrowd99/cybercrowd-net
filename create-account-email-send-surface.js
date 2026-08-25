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
// Create the approved Enter Email + Send human-action surface
// inside the Sequence #3 glass plaque.
//
// FUNCTION:
// installEmailSendSurface()
//
// INPUT:
// cybercrowd:face-two-arrived
//
// LOCKED VISUALS:
// Approved ENTER YOUR EMAIL HERE decal.
// Approved SEND decal.
//
// FLOW:
// approved ENTER YOUR EMAIL HERE decal
// -> human click
// -> same footprint becomes blank writable email surface
// -> human types email
// -> approved SEND decal remains next human action
//
// ONE-FILE ASSET RULE:
// Both approved decals are embedded below.
// No side image files.
// No placeholder asset strings.
// No new graphics.

export function installEmailSendSurface() {
  const APPROVED_ENTER_EMAIL_DECAL =
    "data:image/webp;base64,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";

  const APPROVED_SEND_DECAL =
    "data:image/webp;base64,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";

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

      emailInvite.setAttribute(
        "aria-label",
        "Enter your email here"
      );

      emailInvite.style.padding =
        "0";

      emailInvite.style.border =
        "0";

      emailInvite.style.overflow =
        "hidden";

      emailInvite.style.backgroundImage =
        `url("${APPROVED_ENTER_EMAIL_DECAL}")`;

      emailInvite.style.backgroundSize =
        "100% 100%";

      emailInvite.style.backgroundPosition =
        "center";

      emailInvite.style.backgroundRepeat =
        "no-repeat";

      emailInvite.style.color =
        "transparent";

      emailInvite.style.cursor =
        "pointer";

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

      email.setAttribute(
        "aria-label",
        "Email address"
      );

      email.hidden =
        true;

      const sendButton =
        document.createElement("button");

      sendButton.id =
        "sendButton";

      sendButton.type =
        "button";

      sendButton.disabled =
        true;

      sendButton.setAttribute(
        "aria-disabled",
        "true"
      );

      sendButton.setAttribute(
        "aria-label",
        "Send"
      );

      sendButton.style.padding =
        "0";

      sendButton.style.border =
        "0";

      sendButton.style.overflow =
        "hidden";

      sendButton.style.backgroundImage =
        `url("${APPROVED_SEND_DECAL}")`;

      sendButton.style.backgroundSize =
        "100% 100%";

      sendButton.style.backgroundPosition =
        "center";

      sendButton.style.backgroundRepeat =
        "no-repeat";

      sendButton.style.color =
        "transparent";

      sendButton.style.cursor =
        "default";

      emailInvite.addEventListener(
        "click",
        () => {
          emailInvite.replaceWith(
            email
          );

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

          sendButton.style.cursor =
            hasValue ? "pointer" : "default";
        }
      );

      entryForm.append(
        emailInvite,
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
