// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: entry-flow-controller.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
// POINT — DO NOT NEST
//
// JOB:
// Connect the existing Create Account browser entry components.
//
// DOES NOT OWN:
// Email validation rules.
// Send-arm rules.
// Button lock behavior.
// Button unlock behavior.
// Status mutation behavior.
// Network request implementation.
// Turnstile rendering implementation.
// Turnstile verification.
// Auth.
// Tokens.
// Storage.
// Postmark.
// WHOOSH.
// Overlay behavior.
// Routing.

async function startCyberCrowdEntryFlow() {
  const emailInput =
    document.getElementById("email");

  const sendButton =
    document.getElementById("sendButton");

  const status =
    document.getElementById("status");

  const loadClassicHelper = (src) =>
    new Promise((resolve, reject) => {
      const script =
        document.createElement("script");

      script.src = src;
      script.onload = resolve;
      script.onerror = reject;

      document.head.appendChild(script);
    });

  await Promise.all([
    loadClassicHelper("./entry-button-lock.js"),
    loadClassicHelper("./entry-button-unlock.js"),
    loadClassicHelper("./entry-status.js")
  ]);

  const { validateEmail } =
    await import("./entry-email-validator.js");

  const { armSend } =
    await import("./entry-send-arm.js");

  const { sendVerificationRequest } =
    await import("./request-entry-client.js");

  const { openTurnstileOne } =
    await import("./turnstile-one-ui.js");

  const humanState = {
    human: false,
    token: ""
  };

  const refreshSendState = () => {
    const emailState =
      validateEmail(emailInput.value);

    const readyState =
      armSend(emailState, humanState);

    if (readyState.ready) {
      unlockCyberCrowdEntryButton(sendButton);
    } else {
      lockCyberCrowdEntryButton(
        sendButton,
        "Send"
      );
    }

    return readyState;
  };

  window.addEventListener(
    "cybercrowd:human-passed",
    (event) => {
      const token =
        event?.detail?.token;

      humanState.human =
        typeof token === "string" &&
        token.length > 0;

      humanState.token =
        humanState.human
          ? token
          : "";

      refreshSendState();

      setCyberCrowdEntryStatus(
        status,
        ""
      );
    }
  );

  emailInput.addEventListener(
    "input",
    refreshSendState
  );

  sendButton.addEventListener(
    "click",
    async () => {
      const emailState =
        validateEmail(emailInput.value);

      if (!emailState.valid) {
        setCyberCrowdEntryStatus(
          status,
          "Please enter a valid email."
        );
        return;
      }

      const readyState =
        armSend(
          emailState,
          humanState
        );

      if (!readyState.ready) {
        setCyberCrowdEntryStatus(
          status,
          "Complete the human check."
        );
        return;
      }

      lockCyberCrowdEntryButton(
        sendButton,
        "Sending"
      );

      const result =
        await sendVerificationRequest(
          readyState
        );

      if (!result.success) {
        setCyberCrowdEntryStatus(
          status,
          "Unable to send verification email."
        );

        unlockCyberCrowdEntryButton(
          sendButton
        );
      }
    }
  );

  if (document.readyState === "complete") {
    openTurnstileOne();
  } else {
    window.addEventListener(
      "load",
      openTurnstileOne,
      { once: true }
    );
  }

  refreshSendState();
}

startCyberCrowdEntryFlow();
