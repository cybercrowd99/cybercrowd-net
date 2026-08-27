// CYBERCROWD
//
// FILE:
// create-account-sequence-three-send-readiness.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Convert one validated email state
// plus one Turnstile #2 token
// into one SEND-ready state.
//
// FUNCTION:
// installSequenceThreeSendReadiness()
//
// INPUT:
// cybercrowd:sequence-three-email-validated
//
// ACTION:
// armSend()
//
// OUTPUT:
// cybercrowd:sequence-three-send-ready
//
// PAYLOAD:
// readyState
//
// DOES NOT OWN:
// Email validation.
// Human verification.
// Network.
// Result mapping.
// Success emission.
// Turnstile #1.
// Turnstile #2 rendering.
// Token creation.
// WHOOSH.
// Movement.
// Audio.
// Authentication.
// Session.
// Routing.
// Backend authority.

import {
  armSend
} from "./entry-send-arm.js";

export function installSequenceThreeSendReadiness() {
  window.addEventListener(
    "cybercrowd:sequence-three-email-validated",
    (event) => {
      const emailState =
        event?.detail?.emailState;

      const token =
        event?.detail?.token;

      const humanState = {
        human: true,
        token
      };

      const readyState =
        armSend(
          emailState,
          humanState
        );

      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:sequence-three-send-ready",
          {
            detail: {
              readyState
            }
          }
        )
      );
    },
    { once: true }
  );

  return true;
}
