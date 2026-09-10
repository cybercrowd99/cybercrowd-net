// FILE ACTION: REPLACE EXISTING FILE
// FILE: vault-members-only-click.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Remove email Turnstile event from Members Only
//
// ENTRANCE:
// .vault-members-only click
//
// EXIT:
// cybercrowd:returning-member-requested

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
