// CYBERCROWD
//
// FILE:
// create-account-sequence-four-email-open.js
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
// Open the real Sequence #4 Email input
// immediately when its face arrives.
//
// FUNCTION:
// installSequenceFourEmailOpen()
//
// INPUT:
// cybercrowd:face-three-arrived
//
// OUTPUT:
// cybercrowd:email-opened
//
// HUMAN ACTION:
// None.
//
// Window #3 touch already supplied
// the human action that brought
// Window #4 into position.

export function installSequenceFourEmailOpen() {
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

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:email-opened"
        )
      );

      email.focus({
        preventScroll: true
      });
    },
    { once: true }
  );

  return true;
}
