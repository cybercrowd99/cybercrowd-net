/*
CYBERCROWD
FILE: create-account-flow.js

BUILD LAW:
1 FILE
1 JOB
1 ACTION

JOB:
Own the public create-account entry sequence only.

ACTION:
Advance the existing entry surface through its ordered public states.

FLOW:
REGISTER
→ create-account.html
→ TURNSTILE #1
→ VERIFIED
→ SURFACE-CLOSING SOUND
→ EMAIL ENTRY
→ EMAIL CLICK
→ WHEEL ROTATE + SOUND
→ VERIFIED TURNSTILE
→ AUTO SWIPE TO SEND
→ HUMAN PRESSES SEND
→ EXISTING EMAIL REQUEST LANE
→ EMAIL GOES OUT
→ CHECK EMAIL / HURRY BACK

DOES NOT OWN:
CSS styling.
Turnstile rendering internals.
Turnstile private verification.
Email validation internals.
Email transmission internals.
Token creation.
KV.
D1.
Postmark.
Private authority.
Routing after verification.
*/

export function startCreateAccountFlow() {
  const page = document.querySelector(".page");
  const plaque = document.querySelector(".glass-plaque");
  const email = document.getElementById("email");
  const send = document.getElementById("sendButton");
  const sound = document.getElementById("surfaceClosingSound");

  if (!page || !plaque) {
    return;
  }

  const playSurfaceSound = () => {
    if (!sound) {
      return;
    }

    sound.currentTime = 0;
    sound.play().catch(() => {});
  };

  window.addEventListener(
    "cybercrowd:turnstile-one-verified",
    () => {
      playSurfaceSound();

      page.classList.add("email-entry-open");
      plaque.classList.add("email-entry-open");

      if (email) {
        email.disabled = false;
      }
    }
  );

  if (email) {
    email.addEventListener(
      "click",
      () => {
        playSurfaceSound();

        page.classList.add("wheel-turn");
        plaque.classList.add("wheel-turn");
      },
      { once: true }
    );
  }

  window.addEventListener(
    "cybercrowd:turnstile-two-verified",
    () => {
      playSurfaceSound();

      page.classList.add("send-open");
      plaque.classList.add("send-open");

      if (send) {
        send.disabled = false;
        send.setAttribute("aria-disabled", "false");
        send.focus();
      }
    }
  );

  window.addEventListener(
    "cybercrowd:email-sent",
    () => {
      page.classList.add("check-email-open");
      plaque.classList.add("check-email-open");
    }
  );
}
