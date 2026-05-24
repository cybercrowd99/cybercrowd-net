/* ============================================================
   adWorm — DASHBOARD API BRIDGE
   CyberCrowd Layer 1 Broadcast Subsystem
   Purpose: Define client-side API contract for backend integration
   No network calls. No persistence. Stubs only.
   ============================================================ */

/* ============================================================
   SUBMIT CAMPAIGN
   ============================================================ */

/**
 * Stub for submitting a new adWorm campaign to the backend.
 * @param {Object} submission
 * @returns {Promise<Object>}
 */
export async function apiSubmitCampaign(submission) {
  console.log("[API][SubmitCampaign] Stub invoked:", submission);

  // Placeholder response
  return {
    ok: true,
    id: "stub-" + Date.now(),
    status: "received"
  };
}

/* ============================================================
   FETCH ROOM CONTENT QUEUE
   ============================================================ */

/**
 * Stub for retrieving approved campaigns.
 * @returns {Promise<Array>}
 */
export async function apiFetchRoomContent() {
  console.log("[API][FetchRoomContent] Stub invoked");

  return [
    // Example placeholder entry
    { id: "example-room-1", type: "sponsor", copy: "Sample Approved Campaign" }
  ];
}

/* ============================================================
   FETCH COURT QUEUE
   ============================================================ */

/**
 * Stub for retrieving flagged campaigns.
 * @returns {Promise<Array>}
 */
export async function apiFetchCourt() {
  console.log("[API][FetchCourt] Stub invoked");

  return [
    // Example placeholder entry
    { id: "example-court-1", type: "psa", copy: "Flagged Campaign Example" }
  ];
}

/* ============================================================
   UPDATE REVIEW STATUS
   ============================================================ */

/**
 * Stub for updating the review status of a submission.
 * @param {string} id
 * @param {string} status - "approved" | "rejected" | "needs_changes"
 * @returns {Promise<Object>}
 */
export async function apiUpdateReviewStatus(id, status) {
  console.log("[API][UpdateReviewStatus] Stub invoked:", { id, status });

  return {
    ok: true,
    id,
    newStatus: status
  };
}
