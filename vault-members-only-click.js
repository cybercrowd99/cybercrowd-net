// FILE ACTION: CREATE NEW FILE
// FILE: vault-members-only-click.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Emit returning member request from Members Only click
// CONTEXT:
// One rock.
// One object.
// One movement.
// One function.
// One entrance.
// One exit.
// One actual end.
//
// ENTRANCE:
// .vault-members-only click
//
// EXIT:
// cybercrowd:returning-member-requested
//
// DOES NOT OWN:
// Routing.
// Turnstile.
// Identity.
// Verification.
// Continuity.
// Email.
// Password.
// Session.
// Cookie.
// Voice.
// Dashboard.

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
      window.dispatchEvent(
        new CustomEvent(
          "cybercrowd:returning-member-requested"
        )
      );
    }
  );
}

installVaultMembersOnlyClick();
