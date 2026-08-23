// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-email-descriptor-activation.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Own the first human activation of the Email descriptor.
//
// FUNCTION:
// installEmailDescriptorActivation()
//
// INPUT:
// First click on #email.
// OR
// First typing keystroke on #email.
//
// BEHAVIOR:
// First interaction activates the Email descriptor.
// If activation comes from a typing keystroke,
// that first keystroke is consumed and the email remains blank.
//
// OUTPUT:
// cybercrowd:email-descriptor-activated
//
// DOES NOT OWN:
// Email DOM creation.
// Email reveal.
// Send reveal.
// Descriptor visual styling.
// Email validation.
// Email transmission.
// Audio.
// Wheel movement.
// Movement #1.
// Movement #2.
// Movement #3.
// Turnstile rendering.
// Turnstile verification.
// Postmark.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installEmailDescriptorActivation() {
  const email =
    document.getElementById("email");

  if (!email) {
    return false;
  }

  let activated = false;

  const activate = (source) => {
    if (activated) {
      return;
    }

    activated = true;

    window.dispatchEvent(
      new CustomEvent(
        "cybercrowd:email-descriptor-activated",
        {
          detail: {
            source
          }
        }
      )
    );
  };

  email.addEventListener(
    "click",
    () => {
      activate("click");
    }
  );

  email.addEventListener(
    "keydown",
    (event) => {
      if (activated) {
        return;
      }

      const typingKey =
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey;

      if (!typingKey) {
        return;
      }

      event.preventDefault();

      email.value = "";

      activate("keystroke");
    }
  );

  return true;
}
