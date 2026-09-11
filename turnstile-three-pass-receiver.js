// CYBERCROWD
//
// FILE:
// turnstile-three-pass-receiver.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Receive the completed
// Turnstile #3 caretaker checkpoint.
//
// FUNCTION:
// installTurnstileThreePassReceiver()
//
// INPUT:
// cybercrowd:turnstile-three-passed
//
// OUTPUT:
// cybercrowd:turnstile-three-token-ready
//
// NEXT RECEIVER:
// turnstile-three-email-provider.js
//
// DOES NOT OWN:
// Turnstile rendering.
// Turnstile #1.
// Turnstile #2.
// Email lookup.
// Email input.
// uIDL matching.
// Password input.
// Password verification.
// Session.
// Cookie.
// Routing.
// UI.
// Movement.
// Turnstile #4.

export function installTurnstileThreePassReceiver() {
  window.addEventListener(
    "cybercrowd:turnstile-three-passed",
    async (event) => {
      const token =
        event?.detail?.token;

      if (
        typeof token !== "string" ||
        token.length === 0
      ) {
        return;
      }

      const {
        installTurnstileThreeEmailProvider
      } =
        await import(
          "./turnstile-three-email-provider.js"
        );

      installTurnstileThreeEmailProvider();

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:turnstile-three-token-ready",
          {
            detail: {
              token
            }
          }
        )
      );
    }
  );
}

installTurnstileThreePassReceiver();
