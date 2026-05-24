/* ============================================================
   adWorm — DASHBOARD CORE LOGIC
   CyberCrowd Layer 1 Broadcast Subsystem
   Handles: submission, routing, queue updates
   No styling. No design. Pure logic.
   ============================================================ */

import { runAutoFilter } from "./adworm.dashboard.filters.js";
import { sendToRoomContent, sendToCourt } from "./adworm.dashboard.review.js";

/* ============================================================
   ELEMENT HOOKS
   ============================================================ */

const form = document.getElementById("adworm-submission-form");
const autofilterResult = document.getElementById("autofilter-result");
const roomContentList = document.getElementById("roomcontent-list");
const courtList = document.getElementById("court-list");

/* ============================================================
   SUBMISSION HANDLER
   ============================================================ */

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  const submission = {
    type: formData.get("campaignType"),
    theme: formData.get("themeChoice"),
    asset: formData.get("asset"),
    copy: formData.get("campaignCopy"),
    timestamp: Date.now()
  };

  // Run auto-filter
  const filterResult = await runAutoFilter(submission);

  autofilterResult.textContent = filterResult.message;

  // Route based on filter result
  if (filterResult.pass) {
    addToRoomContent(submission);
    sendToRoomContent(submission);
  } else {
    addToCourt(submission);
    sendToCourt(submission);
  }

  form.reset();
});

/* ============================================================
   QUEUE UPDATERS
   ============================================================ */

function addToRoomContent(submission) {
  const li = document.createElement("li");
  li.textContent = `[${submission.type}] ${submission.copy || "(no copy)"}`;
  roomContentList.appendChild(li);
}

function addToCourt(submission) {
  const li = document.createElement("li");
  li.textContent = `[${submission.type}] ${submission.copy || "(no copy)"}`;
  courtList.appendChild(li);
}
