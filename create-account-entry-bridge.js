// CYBERCROWD
//
// FILE:
// create-account-entry-bridge.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Connect the live Sequence #3 Turnstile #2 YES response
// to the existing verification-email pipeline.
//
// FUNCTION:
// installEntryBridge()
//
// LIVE TRACK:
//
// cybercrowd:human-passed
// -> remember Turnstile #1 browser token
//
// cybercrowd:turnstile-one-verified
// -> private Turnstile #1 human verification confirmed
//
// cybercrowd:face-two-arrived
// -> Sequence #3 EMAIL + SEND surface exists
// -> install existing SEND human-action boundary
//
// open email
// -> cybercrowd:email-opened
// -> SEND human-action boundary becomes live
//
// human touches SEND
// -> cybercrowd:turnstile-two-requested
// -> Turnstile #2 opens
//
// Turnstile #2 NO
// -> blocked
//
// Turnstile #2 YES
// -> cybercrowd:turnstile-two-passed
// -> receive Turnstile #2 token
// -> require existing Turnstile #1 verification
// -> validate existing #email
// -> arm existing Send gate with Turnstile #2 token
// -> request-entry-client.js
// -> POST /api/auth/send-verification
// -> map result
// -> emit cybercrowd:email-sent
//
// DOES NOT OWN:
// Email surface.
// SEND surface.
// SEND graphic.
// Waiting widget.
// Turnstile rendering.
// Turnstile #1 verification decision.
// Turnstile #2 rendering.
// Network implementation.
// Postmark.
// Setup token.
// WHOOSH.
// Audio.
// Authentication.
// Session.
// Routing.
// Backend authority.

import {
  installSendAction
} from "./create-account-send-action.js";

import {
  validateEmail
} from "./entry-email-validator.js";

import {
  armSend
} from "./entry-send-arm.js";

import {
  sendVerificationRequest
} from "./request-entry-client.js";

import {
  mapSendResult
} from "./entry-send-result.js";

import {
  emitSendSuccess
} from "./entry-send-success.js";

export function installEntryBridge() {
  let turnstileOneToken = "";

  let turnstileOneVerified = false;

  let sending = false;

  window.addEventListener(
    "cybercrowd:human-passed",
    (event) => {
      const token =
        event?.detail?.token;

      if (
        typeof token !== "string" ||
        token.length === 0
      ) {
        turnstileOneToken = "";
        turnstileOneVerified = false;
        return;
      }

      turnstileOneToken = token;
    }
  );

  window.addEventListener(
    "cybercrowd:turnstile-one-verified",
    () => {
      if (
        turnstileOneToken.length === 0
      ) {
        return;
      }

      turnstileOneVerified = true;
    }
  );

  window.addEventListener(
    "cybercrowd:face-two-arrived",
    () => {
      installSendAction();
    },
    { once: true }
  );

  window.addEventListener(
    "cybercrowd:turnstile-two-passed",
    async (event) => {
      if (sending) {
        return;
      }

      if (!turnstileOneVerified) {
        return;
      }

      const turnstileTwoToken =
        event?.detail?.token;

      if (
        typeof turnstileTwoToken !==
          "string" ||
        turnstileTwoToken.length === 0
      ) {
        return;
      }

      const emailInput =
        document.getElementById(
          "email"
        );

      if (!emailInput) {
        return;
      }

      const emailState =
        validateEmail(
          emailInput.value
        );

      const humanState = {
        human: true,
        token: turnstileTwoToken
      };

      const readyState =
        armSend(
          emailState,
          humanState
        );

      if (!readyState.ready) {
        return;
      }

      sending = true;

      try {
        const sendResult =
          await sendVerificationRequest(
            readyState
          );

        const result =
          mapSendResult(
            sendResult
          );

        if (
          result.status !== "sent"
        ) {
          return;
        }

        emitSendSuccess();
      } finally {
        sending = false;
      }
    }
  );

  return true;
}
