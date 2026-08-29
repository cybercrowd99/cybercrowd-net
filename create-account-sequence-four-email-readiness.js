// CYBERCROWD
//
// FILE:
// create-account-sequence-four-email-readiness.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #4
//
// JOB:
// Continuously resolve Sequence #4
// Email readiness.
//
// FUNCTION:
// installSequenceFourEmailReadiness()
//
// STATE:
// KEEP TRYING
// ↕
// READY
//
// READY SHAPE:
// local@domain.tld
//
// EXAMPLES:
//
// cybercrowd@yahoo.com
// cybercrowd@gmail.com
// cybercrowd@live.com
// cybercrowd@domain.co
//
// NOT READY:
//
// cybercrowd@
// cybercrowd@gmail
// cybercrowd@live.co.
// @gmail.com
//
// OUTPUT:
// cybercrowd:sequence-four-email-readiness
//
// GLASS STATE:
// .is-email-ready

export function installSequenceFourEmailReadiness() {
  window.addEventListener(
    "cybercrowd:face-three-arrived",
    () => {
      const plaque =
        document.querySelector(
          ".glass-plaque-four"
        );

      if (!plaque) {
        return;
      }

      const email =
        plaque.querySelector(
          ":scope > .email-field"
        );

      if (!email) {
        return;
      }

      email.addEventListener(
        "input",
        () => {
          const value =
            email.value.trim();

          const ready =
            email.checkValidity() &&
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
              value
            );

          plaque.classList.toggle(
            "is-email-ready",
            ready
          );

          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:sequence-four-email-readiness",
              {
                detail: {
                  ready
                }
              }
            )
          );
        }
      );
    },
    { once: true }
  );

  return true;
}
