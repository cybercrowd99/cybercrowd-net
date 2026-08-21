// create-account-entry-bridge.js
// CyberCrowd — Bridge from old monolith to new recovery lane.
// JOB: Override Button 4's send behavior and route it into runEntryPipeline().
// DOES NOT delete or modify create-account.js. Pure ownership transfer.

import { runEntryPipeline } from "./entry-flow-harness.js";

export function installEntryBridge() {
  const emailInput = document.querySelector("#email");
  const button4 = document.querySelector("#button4");

  if (!emailInput || !button4) {
    console.error("Entry bridge: missing email input or Button 4");
    return;
  }

  button4.addEventListener("click", async (event) => {
    event.preventDefault();

    const result = await runEntryPipeline({
      rawEmail: emailInput.value,
      turnstileWidgetId: window.__turnstileWidgetId || null
    });

    console.log("ENTRY PIPELINE RESULT:", result);
  });
}
