// create-account-entry-bridge.js
import { runEntryPipeline } from "./entry-flow-harness.js";

export function installEntryBridge() {
  const emailInput = document.querySelector("#email");
  const button4 = document.querySelector("#button4");

  button4.addEventListener("click", async (event) => {
    event.preventDefault();

    const result = await runEntryPipeline({
      rawEmail: emailInput.value,
      turnstileWidgetId: window.__turnstileWidgetId
    });

    console.log("ENTRY PIPELINE RESULT:", result);
  });
}
