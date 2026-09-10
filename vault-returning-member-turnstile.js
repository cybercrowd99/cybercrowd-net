// FILE ACTION: CREATE NEW FILE
// FILE: vault-returning-member-turnstile.js
// REPO: cybercrowd99/cybercrowd-net
// COMMIT: Add isolated Vault returning member turnstile
//
// ENTRANCE:
// cybercrowd:returning-member-requested
//
// EXIT:
// cybercrowd:returning-member-passed
//
// DOES NOT TOUCH:
// create-account-entry.js
// turnstile-two-ui.js
// SEND
// Email
// Create Account Turnstile #1
// Create Account Turnstile #2

function installVaultReturningMemberTurnstile() {
  let opened = false;

  function renderReturningMemberTurnstile() {
    if (opened) {
      return;
    }

    opened = true;

    let slot =
      document.getElementById(
        "vault-returning-member-turnstile"
      );

    if (!slot) {
      slot =
        document.createElement(
          "div"
        );

      slot.id =
        "vault-returning-member-turnstile";

      slot.style.position =
        "absolute";

      slot.style.left =
        "50%";

      slot.style.bottom =
        "18%";

      slot.style.transform =
        "translateX(-50%)";

      slot.style.zIndex =
        "10000";

      const frame =
        document.querySelector(
          ".vault-frame"
        ) || document.body;

      frame.appendChild(
        slot
      );
    }

    window.turnstile.render(
      "#vault-returning-member-turnstile",
      {
        sitekey:
          "0x4AAAAAACvkecVo2F3hpb1r",

        callback(token) {
          window.dispatchEvent(
            new CustomEvent(
              "cybercrowd:returning-member-passed",
              {
                detail: {
                  token
                }
              }
            )
          );
        }
      }
    );
  }

  function openReturningMemberTurnstile() {
    if (window.turnstile) {
      renderReturningMemberTurnstile();
      return;
    }

    let loader =
      document.getElementById(
        "vault-turnstile-api"
      );

    if (!loader) {
      loader =
        document.createElement(
          "script"
        );

      loader.id =
        "vault-turnstile-api";

      loader.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

      loader.async =
        true;

      loader.defer =
        true;

      loader.addEventListener(
        "load",
        renderReturningMemberTurnstile,
        { once: true }
      );

      document.head.appendChild(
        loader
      );

      return;
    }

    loader.addEventListener(
      "load",
      renderReturningMemberTurnstile,
      { once: true }
    );
  }

  window.addEventListener(
    "cybercrowd:returning-member-requested",
    openReturningMemberTurnstile
  );
}

installVaultReturningMemberTurnstile();
