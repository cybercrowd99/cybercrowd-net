/* ============================================================
   adWorm — DASHBOARD REVIEW ROUTING
   CyberCrowd Layer 1 Broadcast Subsystem
   Handles: Room Content vs Court routing hooks
   No persistence. No backend. Client-side stubs only.
   ============================================================ */

/* ============================================================
   ROOM CONTENT ROUTING
   ============================================================ */

/**
 * Send an approved submission to the Room Content pipeline.
 * This is where safe, 1970s PBS-compatible campaigns live.
 *
 * @param {Object} submission
 */
export function sendToRoomContent(submission) {
  // Stub: replace with server/API call when backend is ready.
  console.log("[adWorm][RoomContent] Submission approved:", submission);
}

/* ============================================================
   COURT ROUTING
   ============================================================ */

/**
 * Send a flagged submission to Court for human review.
 * This is the strict review lane for any questionable content.
 *
 * @param {Object} submission
 */
export function sendToCourt(submission) {
  // Stub: replace with server/API call when backend is ready.
  console.log("[adWorm][Court] Submission flagged for review:", submission);
}
