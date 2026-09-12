// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// vault-members-only-click.js
//
// LOCATION:
// REPOSITORY ROOT / NET
//
// JOB:
// Members Only button opens the
// existing returning-member access page.
//
// ENTRANCE:
// .vault-members-only click
//
// EXIT:
// /auth_login.html
//
// DOES NOT OWN:
// Vault presentation.
// Button presentation.
// Turnstile.
// Email.
// Password verification.
// Authentication.
// Session.
// Cookie.
// Routing beyond this one destination.

function installVaultMembersOnlyClick() {
  const membersOnly =
    document.querySelector(
      ".vault-members-only"
    );

  if (!membersOnly) {
    return;
  }

  membersOnly.addEventListener(
    "click",
    function () {
      window.location.href =
        "/auth_login.html";
    }
  );
}

installVaultMembersOnlyClick();
