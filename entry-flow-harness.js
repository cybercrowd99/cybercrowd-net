// entry-flow-harness.js
// CyberCrowd — Full Recovery-Lane Pipeline Harness
// JOB: Wire validator → human pass → send arm → send → result → success event.
// NO UI logic. NO forbidden file access. Pure orchestration.

import { validateEmail } from "./entry-email-validator.js";
import { runHumanPass } from "./entry-human-pass.js";
import { armSend } from "./entry-send-arm.js";
import { sendVerificationRequest } from "./request-entry-client.js";
import { mapSendResult } from "./entry-send-result.js";
import { emitSendSuccess } from "./entry-send-success.js";

export async function runEntryPipeline({
  rawEmail,
  turnstileWidgetId
}) {
  // #2 — Validate email
  const emailState = validateEmail(rawEmail);
  if (!emailState.valid) {
    return { stage: "email", success: false, reason: emailState.reason };
  }

  // #3 — Human verification
  const humanState = await runHumanPass(turnstileWidgetId);
  if (!humanState.human) {
    return { stage: "human", success: false, reason: humanState.reason };
  }

  // #4 — Arm send
  const readyState = armSend(emailState, humanState);
  if (!readyState.ready) {
    return { stage: "ready", success: false, reason: readyState.reason };
  }

  // #5 — Send request
  const backendResult = await sendVerificationRequest(readyState);

  // #11 — Interpret backend result
  const uiResult = mapSendResult(backendResult);

  if (uiResult.status === "sent") {
    // #12 — Emit success event (WHOOSH listener handles the rest)
    emitSendSuccess();
  }

  return {
    stage: "complete",
    success: uiResult.status === "sent",
    reason: uiResult.reason
  };
}
