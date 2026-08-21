// entry-send-result.js
// CyberCrowd — Send Result Mapper
// JOB: Interpret sendVerificationRequest() result for the UI.
// NO fetch. NO backend. NO WHOOSH playback here.

export function mapSendResult(sendResult) {
  if (!sendResult || sendResult.success !== true) {
    return {
      status: "failed",
      message: "EMAIL FAILED",
      reason: sendResult?.reason || "unknown"
    };
  }

  return {
    status: "sent",
    message: "EMAIL SENT",
    reason: "email-sent"
  };
}
