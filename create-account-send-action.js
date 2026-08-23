// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-send-action.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Own the human Send click boundary.
//
// FUNCTION:
// installSendAction()
//
// INPUT:
// Human click on #sendButton.
//
// OUTPUT:
// cybercrowd:send-requested
//
// DOES NOT OWN:
// Email DOM creation.
// Email descriptor activation.
// Email entry.
// Email validation.
// Email transmission.
// Movement #1.
// Movement #2.
// Movement #3.
// Wheel geometry.
// Audio.
// Turnstile rendering.
// Turnstile verification.
// Postmark.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installSendAction() {
  const sendButton =
    document.getElementById("sendButton");

  if (!sendButton) {
    return false;
  }

  let requested = false;

  sendButton.addEventListener(
    "click",
    () => {
      if (requested) {
        return;
      }

      requested = true;

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:send-requested"
        )
      );
    }
  );

  return true;
}
