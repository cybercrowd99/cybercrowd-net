// CYBERCROWD
//
// FILE:
// create-account-send-action.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Own the human SEND button press.
//
// FUNCTION:
// installSendAction()
//
// INPUT:
// Human presses #sendButton.
//
// OUTPUT:
// cybercrowd:turnstile-two-requested
//
// LAW:
// BUTTON EXISTS.
// BUTTON IS PRESSABLE.
// HUMAN PRESSES BUTTON.
// ONE EVENT LEAVES.
//
// DOES NOT OWN:
// Email opening.
// Email presentation.
// Email validation.
// Turnstile rendering.
// Verification.
// Email transmission.
// WHOOSH.
// Authentication.
// Session.
// Routing.
// Backend authority.

export function installSendAction() {
  const sendButton =
    document.getElementById(
      "sendButton"
    );

  if (!sendButton) {
    return false;
  }

  sendButton.disabled =
    false;

  sendButton.setAttribute(
    "aria-disabled",
    "false"
  );

  sendButton.addEventListener(
    "click",
    () => {
      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:turnstile-two-requested"
        )
      );
    },
    { once: true }
  );

  return true;
}
