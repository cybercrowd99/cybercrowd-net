(function () {
  "use strict";

  const STATE = {
    READY: "ready",
    CHECKING: "checking",
    PASSED: "passed",
    FAILED: "failed",
    EXPIRED: "expired"
  };

  const config = {
    successRedirect: "verify.html",
    expireAfterMs: 2 * 60 * 1000,
    simulatedCheckMs: 650
  };

  let currentState = STATE.READY;
  let gateStartedAt = Date.now();
  let expiryTimer = null;

  const elements = {
    gateCheck: document.getElementById("gateCheck"),
    gateState: document.getElementById("gateState"),
    continueButton: document.getElementById("continueButton"),
    retryButton: document.getElementById("retryButton")
  };

  function hasRequiredElements() {
    return Boolean(
      elements.gateCheck &&
      elements.gateState &&
      elements.continueButton
    );
  }

  function setState(nextState, message) {
    currentState = nextState;

    if (elements.gateState) {
      elements.gateState.textContent = message;
    }

    if (elements.continueButton) {
      elements.continueButton.disabled = nextState !== STATE.PASSED;
    }

    if (elements.gateCheck) {
      if (nextState === STATE.READY) {
        elements.gateCheck.textContent = "□";
        elements.gateCheck.disabled = false;
      }

      if (nextState === STATE.CHECKING) {
        elements.gateCheck.textContent = "…";
        elements.gateCheck.disabled = true;
      }

      if (nextState === STATE.PASSED) {
        elements.gateCheck.textContent = "✓";
        elements.gateCheck.disabled = true;
      }

      if (nextState === STATE.FAILED || nextState === STATE.EXPIRED) {
        elements.gateCheck.textContent = "!";
        elements.gateCheck.disabled = false;
      }
    }
  }

  function startExpiryTimer() {
    window.clearTimeout(expiryTimer);

    expiryTimer = window.setTimeout(function () {
      if (currentState !== STATE.PASSED) {
        setState(
          STATE.EXPIRED,
          "Gate expired. Retry the CyberCrowd human/session check."
        );
      }
    }, config.expireAfterMs);
  }

  function resetGate() {
    gateStartedAt = Date.now();

    setState(
      STATE.READY,
      "Waiting for CyberCrowd session proof."
    );

    startExpiryTimer();
  }

  function runFrontEndGateCheck() {
    if (currentState === STATE.CHECKING || currentState === STATE.PASSED) {
      return;
    }

    const age = Date.now() - gateStartedAt;

    if (age > config.expireAfterMs) {
      setState(
        STATE.EXPIRED,
        "Gate expired. Retry the CyberCrowd human/session check."
      );
      return;
    }

    setState(
      STATE.CHECKING,
      "Checking CyberCrowd session state..."
    );

    window.setTimeout(function () {
      setState(
        STATE.PASSED,
        "Success. Human/session gate passed for this front-end state controller."
      );
    }, config.simulatedCheckMs);
  }

  function continueAfterGate() {
    if (currentState !== STATE.PASSED) {
      setState(
        STATE.FAILED,
        "Gate has not passed. Sensitive action remains blocked."
      );
      return;
    }

    window.location.href = config.successRedirect;
  }

  function bindEvents() {
    elements.gateCheck.addEventListener("click", runFrontEndGateCheck);
    elements.continueButton.addEventListener("click", continueAfterGate);

    if (elements.retryButton) {
      elements.retryButton.addEventListener("click", resetGate);
    }
  }

  function boot() {
    if (!hasRequiredElements()) {
      return;
    }

    bindEvents();
    resetGate();
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
