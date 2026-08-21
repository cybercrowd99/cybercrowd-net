// create-account.js
// CyberCrowd — LIVE PAGE → RECOVERY LANE BRIDGE
// JOB: Connect the existing create-account page to entry-flow-harness.js.
// DOES NOT send email itself.
// DOES NOT own backend logic.
// DOES NOT create setup tokens.

const form = document.getElementById("entryForm");
const emailInput = document.getElementById("email");
const sendButton = document.getElementById("sendButton");
const statusText = document.getElementById("status");
const turnstileSlot = document.getElementById("turnstileSlot");

const checkEmailOverlay = document.getElementById("checkEmailOverlay");
const checkEmailWhoosh = document.getElementById("checkEmailWhoosh");

let widgetId = null;
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

async function createHumanWidget() {
  await waitForTurnstile();

  if (widgetId !== null) {
    return widgetId;
  }

  turnstileSlot.style.display = "grid";

  widgetId = window.turnstile.render("#turnstileSlot", {
    sitekey: "0x4AAAAAACvkecVo2F3hpb1r",
    execution: "execute",
    appearance: "interaction-only",
    callback: function () {
      setStatus("Human verified.");
    },
    "expired-callback": function () {
      setStatus("Human verification expired.");
    },
    "error-callback": function () {
      setStatus("Human verification failed.");
    }
  });

  return widgetId;
}

async function startLiveRecoveryLane(event) {
  event.preventDefault();

  if (pipelineRunning) {
    return;
  }

  pipelineRunning = true;
  sendButton.disabled = true;

  try {
    const rawEmail = emailInput.value.trim();

    console.log("[CyberCrowd] LIVE BRIDGE START");
    console.log("[CyberCrowd] rawEmail:", rawEmail);

    setStatus("Starting verification.");

    const {
      runEntryPipeline,
      installWhooshListener
    } = await loadRecoveryLane();

    console.log("[CyberCrowd] harness loaded:", typeof runEntryPipeline === "function");

    installWhooshListener({
      playWhoosh,
      showCheckEmailOverlay
    });

    const turnstileWidgetId = await createHumanWidget();

    console.log(
      "[CyberCrowd] turnstileWidgetId:",
      turnstileWidgetId
    );

    const result = await runEntryPipeline({
      rawEmail,
      turnstileWidgetId
    });

    console.log("[CyberCrowd] PIPELINE RESULT:", result);

    if (result.success === true) {
      setStatus("EMAIL SENT");

      form.reset();

      if (window.turnstile && widgetId !== null) {
        window.turnstile.reset(widgetId);
      }

      return;
    }

    setStatus(
      `STOPPED: ${result.stage || "unknown"} / ${result.reason || "unknown"}`
    );

  } catch (err) {
    console.error("[CyberCrowd] LIVE BRIDGE ERROR:", err);

    setStatus(
      `ERROR: ${err?.message || "unknown"}`
    );
  } finally {
    pipelineRunning = false;
    sendButton.disabled = false;
  }
}

form.addEventListener("submit", startLiveRecoveryLane);
