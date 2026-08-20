const form = document.getElementById("entryForm");
const emailInput = document.getElementById("email");
const sendButton = document.getElementById("sendButton");
const statusText = document.getElementById("status");
const turnstileSlot = document.getElementById("turnstileSlot");
const checkEmailOverlay = document.getElementById("checkEmailOverlay");
const checkEmailWhoosh = document.getElementById("checkEmailWhoosh");

let humanToken = "";
let widgetId = null;
let gateVisible = false;
let whooshPrimePromise = Promise.resolve();

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

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setStatus(text) {
  statusText.textContent = text;
}

function lockButton(text) {
  sendButton.disabled = true;
  sendButton.textContent = text;
}

function unlockButton() {
  sendButton.disabled = false;
  sendButton.textContent = "Send";
}

function playCheckEmailWhoosh(primeOnly = false) {
  if (!checkEmailWhoosh) return;

  if (primeOnly) {
    checkEmailWhoosh.muted = true;
    checkEmailWhoosh.volume = 0;
    checkEmailWhoosh.currentTime = 0;

    const primeAttempt = checkEmailWhoosh.play();

    whooshPrimePromise = Promise.resolve(primeAttempt)
      .then(function () {
        checkEmailWhoosh.pause();
        checkEmailWhoosh.currentTime = 0;
        checkEmailWhoosh.muted = false;
        checkEmailWhoosh.volume = 0.28;
      })
      .catch(function (error) {
        checkEmailWhoosh.muted = false;
        checkEmailWhoosh.volume = 0.28;
        console.error("CyberCrowd whoosh prime failed:", error);
      });

    return;
  }

  whooshPrimePromise.finally(function () {
    checkEmailWhoosh.pause();
    checkEmailWhoosh.muted = false;
    checkEmailWhoosh.volume = 0.28;
    checkEmailWhoosh.currentTime = 0;

    checkEmailWhoosh.play().catch(function (error) {
      console.error("CyberCrowd whoosh play failed:", error);
    });
  });
}

function showCheckEmailOverlay() {
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

  playCheckEmailWhoosh();
}

function renderHumanGate() {
  if (!window.turnstile) {
    setStatus("Human gate loading. Press Send again in a moment.");
    unlockButton();
    return;
  }

  turnstileSlot.style.display = "grid";
  gateVisible = true;

  if (widgetId !== null) {
    window.turnstile.remove(widgetId);
    widgetId = null;
  }

  widgetId = window.turnstile.render("#turnstileSlot", {
    sitekey: "0x4AAAAAACvkecVo2F3hpb1r",

    callback: function (token) {
      humanToken = token;
      sendButton.disabled = false;
      sendButton.textContent = "Confirm Send";
      setStatus("Human gate passed. Press Confirm Send.");
    },

    "expired-callback": function () {
      humanToken = "";
      setStatus("Human gate expired. Press Send again.");
      unlockButton();
    },

    "error-callback": function () {
      humanToken = "";
      setStatus("Human gate failed. Press Send again.");
      unlockButton();
    }
  });
}

async function sendEntry() {
  const email = emailInput.value.trim();

  if (!isValidEmail(email)) {
    setStatus("Please enter a valid email.");
    emailInput.focus();
    unlockButton();
    return;
  }

  if (!humanToken) {
    lockButton("Check");
    setStatus("Complete the human gate.");

    if (!gateVisible) {
      renderHumanGate();
    } else {
      unlockButton();
    }

    return;
  }

  /*
   * SILENT AUDIO UNLOCK
   *
   * This runs during the Confirm Send user gesture,
   * BEFORE any network await.
   *
   * It does NOT audibly play the whoosh.
   * The banner still owns audible playback.
   */
  playCheckEmailWhoosh(true);

  lockButton("Sending");
  setStatus("Preparing your CyberCrowd entry.");

  try {
    const response = await fetch("/api/auth/send-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        turnstileToken: humanToken
      })
    });

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok || data.success !== true) {
      throw new Error(data.error || "Entry request failed.");
    }

    /*
     * THIS remains the actual banner + audible whoosh trigger.
     */
    showCheckEmailOverlay();

    form.reset();
    humanToken = "";
    gateVisible = false;
    turnstileSlot.style.display = "none";
    setStatus("");

    if (window.turnstile && widgetId !== null) {
      window.turnstile.remove(widgetId);
      widgetId = null;
    }

    unlockButton();

  } catch (error) {
    humanToken = "";

    if (window.turnstile && widgetId !== null) {
      window.turnstile.reset(widgetId);
    }

    setStatus(error.message || "Entry request failed.");
    unlockButton();
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  sendEntry();
});
