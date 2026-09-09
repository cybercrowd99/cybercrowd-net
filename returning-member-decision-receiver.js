// FILE ACTION: CREATE NEW FILE
// FILE: returning-member-decision-receiver.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Route returning member server decision
// CONTEXT:
// Receive the server-authorized
// returning-member result
// and move the browser.
//
// INPUT YES:
// cybercrowd:returning-member-confirmed
//
// INPUT NO:
// cybercrowd:returning-member-retry
//
// DOES NOT OWN:
// Identity.
// Turnstile verification.
// Member verification.
// Password.
// Session.
// Cookie.
// Email.
// Voice.

function installReturningMemberDecisionReceiver() {
  window.addEventListener(
    "cybercrowd:returning-member-confirmed",
    function () {
      window.location.href =
        "/dashboard-surface.html";
    }
  );

  window.addEventListener(
    "cybercrowd:returning-member-retry",
    function () {
      window.location.href =
        "/auth_login.html";
    }
  );
}

installReturningMemberDecisionReceiver();
