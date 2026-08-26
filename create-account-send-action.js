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
// Own the human SEND click boundary.
//
// FUNCTION:
// installSendAction()
//
// ARM:
// cybercrowd:email-opened
//
// OUTPUT:
// cybercrowd:turnstile-two-requested
//
// LAW:
// SEND HAS NO CLICK CONNECTION
// UNTIL ENTER EMAIL HAS OPENED.

export function installSendAction() {
  let connected =
    false;

  let requested =
    false;

  window.addEventListener(
    "cybercrowd:email-opened",
    () => {
      if (connected) {
        return;
      }

      const sendButton =
        document.getElementById(
          "sendButton"
        );

      if (!sendButton) {
        return;
      }

      connected =
        true;

      sendButton.addEventListener(
        "click",
        () => {
          if (
            sendButton.disabled ||
            requested
          ) {
            return;
          }

          requested =
            true;

          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:turnstile-two-requested"
            )
          );
        }
      );
    },
    { once: true }
  );

  return true;
}
