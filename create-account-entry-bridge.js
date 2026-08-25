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
// Connect the live Sequence #3 SEND human action
// to the existing verification-email pipeline.
//
// FUNCTION:
// installEntryBridge()
//
// LIVE TRACK:
//
// cybercrowd:human-passed
// -> remember browser Turnstile token
//
// cybercrowd:turnstile-one-verified
// -> private human verification confirmed
//
// cybercrowd:face-two-arrived
// -> Sequence #3 SEND surface exists
// -> install existing SEND human-action boundary
//
// human touches SEND
// -> cybercrowd:send-requested
// -> validate existing #email
// -> arm existing Send gate
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
// Human verification decision.
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
  let humanToken = "";

  let humanVerified = false;

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
        humanToken = "";
        humanVerified = false;
        return;
      }

      humanToken = token;
    }
  );

  window.addEventListener(
    "cybercrowd:turnstile-one-verified",
    () => {
      if (humanToken.length === 0) {
        return;
      }

      humanVerified = true;
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
    "cybercrowd:send-requested",
    async () => {
      if (sending) {
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
        human:
          humanVerified,
        token:
          humanToken
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
