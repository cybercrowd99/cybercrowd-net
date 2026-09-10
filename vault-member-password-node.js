// FILE ACTION: CREATE NEW FILE
// FILE: vault-member-password-node.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Add Vault returning member password node
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// INPUT:
// cybercrowd:returning-member-passed
//
// OUTPUT:
// #vault-member-password
//
// PARENT:
// .vault-frame
//
// DOES NOT OWN:
// vault.html
// Members Only button
// Returning-member Turnstile
// Password submission
// Password verification
// Session creation
// Routing
// Dashboard
// Create Account
// Email
// SEND

function installVaultMemberPasswordNode() {
  window.addEventListener(
    "cybercrowd:returning-member-passed",
    () => {
      const vault =
        document.querySelector(
          ".vault-frame"
        );

      if (!vault) {
        return;
      }

      if (
        document.getElementById(
          "vault-member-password"
        )
      ) {
        return;
      }

      const password =
        document.createElement(
          "input"
        );

      password.id =
        "vault-member-password";

      password.type =
        "password";

      password.name =
        "password";

      password.autocomplete =
        "current-password";

      password.placeholder =
        "ENTER PASSWORD";

      password.setAttribute(
        "aria-label",
        "Enter password"
      );

      password.style.position =
        "absolute";

      password.style.left =
        "50%";

      password.style.top =
        "50%";

      password.style.transform =
        "translate(-50%, -50%)";

      password.style.width =
        "min(78vw, 320px)";

      password.style.height =
        "54px";

      password.style.padding =
        "0 20px";

      password.style.border =
        "1px solid #d4af37";

      password.style.borderRadius =
        "999px";

      password.style.outline =
        "none";

      password.style.background =
        "rgba(0, 0, 0, 0.72)";

      password.style.color =
        "#f8f3e7";

      password.style.fontSize =
        "1rem";

      password.style.textAlign =
        "center";

      password.style.letterSpacing =
        "0.12em";

      password.style.zIndex =
        "10001";

      vault.appendChild(
        password
      );

      password.focus();
    },
    { once: true }
  );

  return true;
}

installVaultMemberPasswordNode();
