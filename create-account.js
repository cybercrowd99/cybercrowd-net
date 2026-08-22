// CYBERCROWD
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION PATH
//
// JOB:
// Control the create-account human-entry sequence.
//
// TRACK:
// create-account.html
// → SPINNING LOCK
// → HUMAN TOUCH
// → CLOUDFLARE TURNSTILE
// → HUMAN VERIFICATION
// → EMAIL FIELD
// → EMAIL ENTERED
// → SEND BUTTON
// → EXISTING BACKEND ENTRY PIPELINE
// → WHOOSH
// → HURRY BACK
//
// SECURITY:
// REGISTER touch is not Turnstile proof.
// A separate human interaction with Cloudflare Turnstile is required.
// No automatic Turnstile execution.
// No email entry before human verification.
// No Send before human verification and valid email.
//
// RECOVERY LOCK:
// Backend frozen.
// No new helper.
// No new route.
// No bridge.
// No envelope.

const form = document.getElementById("entryForm");
const emailInput = document.getElementById("email");
const sendButton = document.getElementById("sendButton");
const statusText = document.getElementById("status");
const turnstileSlot = document.getElementById("turnstileSlot");
const humanTouch = document.querySelector(".seal-wrapper");

const checkEmailOverlay = document.getElementById("checkEmailOverlay");
const checkEmailWhoosh = document.getElementById("checkEmailWhoosh");

let widgetId = null;
let humanVerified = false;
let pipelineRunning = false;

const flyInClasses = [
  "from-top",
  "from-bottom",
  "from-left",
  "from-right",
  "from-top-left",
  "from-top-right",
  "from-bottom-left",
  "from-bottom-right"
];

function setStatus(text) {
  if (statusText) {
    statusText.textContent = text;
  }
}

function playWhoosh() {
  if (!checkEmailWhoosh) {
    return;
  }

  checkEmailWhoosh.volume = 0.28;
  checkEmailWhoosh.currentTime = 0;

  checkEmailWhoosh.play().catch(() => {});
}

function showCheckEmailOverlay() {
  if (!checkEmailOverlay) {
    return;
  }

  const chosenFlyIn =
    flyInClasses[Math.floor(Math.random() * flyInClasses.length)];

  checkEmailOverlay.classList.remove(
    "from-top",
    "from-bottom",
    "from-left",
    "from-right",
    "from-top-left",
    "from-top-right",
    "from-bottom-left",
    "from-bottom-right",
    "is-visible"
  );

  void checkEmailOverlay.offsetWidth;

  checkEmailOverlay.classList.add(chosenFlyIn);
  checkEmailOverlay.classList.add("is-visible");
  checkEmailOverlay.setAttribute("aria-hidden", "false");

  document.body.classList.add("check-email-open");
}

async function loadRecoveryLane() {
  const [
    harnessModule,
    whooshModule
  ] = await Promise.all([
    import("./entry-flow-harness.js"),
    import("./entry-whoosh-listener.js")
  ]);

  return {
    runEntryPipeline: harnessModule.runEntryPipeline,
    installWhooshListener: whooshModule.installWhooshListener
  };
}

function waitForTurnstile() {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      attempts += 1;

      if (window.turnstile) {
        resolve();
        return;
      }

      if (attempts >= 100) {
        reject(new Error("turnstile-not-loaded"));
        return;
      }

      setTimeout(check, 100);
    };

    check();
  });
}

function lockEntrySurface() {
  emailInput.style.display = "none";
  sendButton.style.display = "none";
  turnstileSlot.style.display = "none";

  emailInput.disabled = true;
  sendButton.disabled = true;

  setStatus("Touch the lock.");
}

function revealEmailEntry() {
  emailInput.disabled = false;
  emailInput.style.display = "";

  emailInput.focus();

  setStatus("Enter your email.");
}

function updateSendState() {
  if (!humanVerified) {
    sendButton.style.display = "none";
    sendButton.disabled = true;
    return;
  }

  const emailValid = emailInput.checkValidity() &&
    emailInput.value.trim().length > 0;

  if (emailValid) {
    sendButton.style.display = "";
    sendButton.disabled = false;
    setStatus("Ready to Send.");
    return;
  }

  sendButton.style.display = "none";
  sendButton.disabled = true;
}

async function activateHumanGate() {
  if (widgetId !== null || humanVerified) {
    return;
  }

  setStatus("Are you human?");

  try {
    await waitForTurnstile();

    turnstileSlot.style.display = "grid";

    widgetId = window.turnstile.render("#turnstileSlot", {
      sitekey: "0x4AAAAAACvkecVo2F3hpb1r",
      appearance: "always",

      callback(token) {
        if (!token) {
          return;
        }

        humanVerified = true;

        if (humanTouch) {
          humanTouch.classList.add("human-touch-active");
        }

        revealEmailEntry();
      },

      "expired-callback"() {
        humanVerified = false;

        emailInput.value = "";
        emailInput.disabled = true;
        emailInput.style.display = "none";

        sendButton.disabled = true;
        sendButton.style.display = "none";

        setStatus("Human verification expired. Touch the lock again.");

        if (window.turnstile && widgetId !== null) {
          window.turnstile.remove(widgetId);
        }

        widgetId = null;
      },

      "error-callback"() {
        humanVerified = false;

        setStatus("Human verification failed. Touch the lock again.");

        if (window.turnstile && widgetId !== null) {
          window.turnstile.remove(widgetId);
        }

        widgetId = null;
      }
    });

  } catch (err) {
    setStatus(
      `ERROR: ${err?.message || "turnstile-not-ready"}`
    );
  }
}

async function startLiveRecoveryLane(event) {
  event.preventDefault();

  if (pipelineRunning) {
    return;
  }

  if (!humanVerified || widgetId === null) {
    setStatus("Human verification required.");
    return;
  }

  const humanToken =
    window.turnstile?.getResponse(widgetId) || "";

  if (!humanToken) {
    setStatus("Human verification required.");
    return;
  }

  const rawEmail = emailInput.value.trim();

  if (!emailInput.checkValidity() || !rawEmail) {
    setStatus("Enter a valid email.");
    return;
  }

  pipelineRunning = true;
  sendButton.disabled = true;

  try {
    setStatus("Sending.");

    const {
      runEntryPipeline,
      installWhooshListener
    } = await loadRecoveryLane();

    installWhooshListener({
      playWhoosh,
      showCheckEmailOverlay
    });

    const result = await runEntryPipeline({
      rawEmail,
      turnstileWidgetId: widgetId
    });

    if (result.success === true) {
      setStatus("EMAIL SENT");

      form.reset();

      humanVerified = false;

      if (window.turnstile && widgetId !== null) {
        window.turnstile.remove(widgetId);
      }

      widgetId = null;

      emailInput.disabled = true;
      emailInput.style.display = "none";

      sendButton.disabled = true;
      sendButton.style.display = "none";

      turnstileSlot.style.display = "none";

      return;
    }

    setStatus(
      `STOPPED: ${result.stage || "unknown"} / ${result.reason || "unknown"}`
    );

  } catch (err) {
    console.error("[CyberCrowd] ENTRY ERROR:", err);

    setStatus(
      `ERROR: ${err?.message || "unknown"}`
    );

  } finally {
    pipelineRunning = false;

    if (humanVerified) {
      updateSendState();
    }
  }
}

lockEntrySurface();

if (humanTouch) {
  humanTouch.addEventListener("click", activateHumanGate);
}

emailInput.addEventListener("input", updateSendState);

form.addEventListener("submit", startLiveRecoveryLane);
