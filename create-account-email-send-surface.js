// CYBERCROWD
//
// FILE:
// create-account-email-send-surface.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Present and attach the live Sequence #3
// email input and SEND button.
//
// CONTROLS:
// #email
// #sendButton
//
// ATTACHMENT:
// .glass-plaque-three
//
// OUTPUT:
// cybercrowd:email-opened
//
// DO NOT CHANGE:
// Existing control geometry.
// Existing decal presentation.
// Existing event behavior.
// Existing validation behavior.
// Existing SEND lock behavior.

const plaque =
  document.querySelector(".glass-plaque-three");

const email =
  document.createElement("input");

email.id = "email";
email.className = "email-field";
email.type = "email";
email.name = "email";
email.inputMode = "email";
email.autocomplete = "email";
email.autocapitalize = "none";
email.spellcheck = false;

email.setAttribute("aria-label", "Enter your email here");

// DIMENSIONS
email.style.position = "absolute";
email.style.top = "46%";
email.style.left = "50%";
email.style.transform = "translate(-50%, -50%) translateZ(4px)";
email.style.width = "min(68%, 350px)";
email.style.minHeight = "58px";
email.style.padding = "0 20px";
email.style.border = "1px solid rgba(82, 53, 20, 0.90)";
email.style.borderRadius = "999px";

// EXISTING STYLES
email.style.overflow = "hidden";
email.style.backgroundImage = `url("${APPROVED_ENTER_EMAIL_DECAL}")`;
email.style.backgroundSize = "contain";
email.style.backgroundPosition = "center";
email.style.backgroundRepeat = "no-repeat";
email.style.backgroundColor = "transparent";
email.style.color = "transparent";
email.style.caretColor = "transparent";
email.style.zIndex = "7";

const sendButton =
  document.createElement("button");

sendButton.id = "sendButton";
sendButton.type = "button";
sendButton.disabled = true;

sendButton.setAttribute("aria-disabled", "true");
sendButton.setAttribute("aria-label", "Send");

// DIMENSIONS
sendButton.style.position = "absolute";
sendButton.style.top = "68%";
sendButton.style.left = "50%";
sendButton.style.transform = "translate(-50%, -50%) translateZ(4px)";
sendButton.style.width = "min(54%, 275px)";
sendButton.style.minHeight = "64px";
sendButton.style.padding = "0 24px";
sendButton.style.border = "1px solid rgba(82, 53, 20, 0.90)";
sendButton.style.borderRadius = "999px";
sendButton.style.background = "linear-gradient(180deg, #e9c979, #9b7131)";
sendButton.style.color = "#2a2118";
sendButton.style.font = "inherit";
sendButton.style.fontSize = "20px";
sendButton.style.fontWeight = "700";
sendButton.style.letterSpacing = "0.12em";
sendButton.style.boxShadow = "0 10px 26px rgba(0, 0, 0, 0.20)";

// EXISTING STYLES
sendButton.style.overflow = "hidden";
sendButton.style.backgroundImage = `url("${APPROVED_SEND_DECAL}")`;
sendButton.style.backgroundSize = "contain";
sendButton.style.backgroundPosition = "center";
sendButton.style.backgroundRepeat = "no-repeat";
sendButton.style.backgroundColor = "transparent";
sendButton.style.cursor = "default";
sendButton.style.zIndex = "7";

let emailOpened = false;
let sendLocked = true;
let sendBusy = false;

const openEmailInput = () => {
  if (emailOpened) return;

  emailOpened = true;

  email.style.backgroundImage = "none";
  email.style.backgroundColor = "rgba(255, 255, 255, 0.82)";
  email.style.color = "#2a2118";
  email.style.caretColor = "#2a2118";
  email.style.cursor = "text";

  email.removeAttribute("readonly");

  window.dispatchEvent(
    new CustomEvent("cybercrowd:email-opened")
  );

  email.focus();
};

email.addEventListener("pointerdown", openEmailInput, { once: true });
email.addEventListener("focus", openEmailInput);

email.addEventListener("input", () => {
  const ready =
    emailOpened &&
    email.checkValidity() &&
    email.value.trim().length > 0;

  sendLocked = !ready;

  sendButton.disabled = sendLocked;

  sendButton.setAttribute(
    "aria-disabled",
    sendLocked ? "true" : "false"
  );

  sendButton.style.cursor =
    sendLocked ? "default" : "pointer";

  sendButton.style.pointerEvents =
    sendLocked ? "none" : "auto";
});

// 🔩 BOLT THEM ON — THE ONLY FIX YOU NEEDED
plaque.appendChild(email);
plaque.appendChild(sendButton);
