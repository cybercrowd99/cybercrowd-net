// entry-send-arm.js
// CyberCrowd — Send Arm Gate (Button 3)
// JOB: Confirm valid email + human token → READY TO SEND.
// NO backend calls. NO email send. NO WHOOSH. NO UI mutation.

export function armSend(emailState, humanState) {
  // Email must be valid
  const emailIsValid =
    emailState &&
    emailState.valid === true &&
    typeof emailState.email === "string" &&
    emailState.email.length > 0;

  // Human token must exist
  const humanIsValid =
    humanState &&
    humanState.human === true &&
    typeof humanState.token === "string" &&
    humanState.token.length > 0;

  if (emailIsValid && humanIsValid) {
    return {
      ready: true,
      reason: "ready-to-send",
      email: emailState.email,
      token: humanState.token
    };
  }

  return {
    ready: false,
    reason: "missing-email-or-human-token",
    email: emailState?.email || null,
    token: humanState?.token || null
  };
}
