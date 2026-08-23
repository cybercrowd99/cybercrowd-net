// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-email-descriptor-response.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Respond to Email descriptor activation.
//
// FUNCTION:
// installEmailDescriptorResponse()
//
// INPUT:
// cybercrowd:email-descriptor-activated
//
// OUTPUT:
// Apply the Email descriptor activated state
// to the existing Email surface.
//
// DOES NOT OWN:
// Raw click input.
// Raw keyboard input.
// Keystroke consumption.
// Email DOM creation.
// Email reveal.
// Send reveal.
// Descriptor expansion styling.
// Descriptor expansion geometry.
// Email validation.
// Email transmission.
// Audio.
// Wheel movement.
// Turnstile rendering.
// Turnstile verification.
// Postmark.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installEmailDescriptorResponse() {
  const entryForm =
    document.querySelector(".entry-form");

  const email =
    document.getElementById("email");

  if (!entryForm || !email) {
    return false;
  }

  let activated = false;

  window.addEventListener(
    "cybercrowd:email-descriptor-activated",
    () => {
      if (activated) {
        return;
      }

      activated = true;

      entryForm.classList.add(
        "email-descriptor-activated"
      );

      email.classList.add(
        "email-descriptor-activated"
      );
    }
  );

  return true;
}
