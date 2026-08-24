// CYBERCROWD
//
// FILE:
// create-account-face-one.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Install the real visible children of Sequence #1
// inside the existing .glass-plaque.
//
// FUNCTION:
// installFaceOne()
//
// HUMAN SEES:
// .glass-plaque
// ├── seal
// ├── title
// ├── welcome
// └── swipe interface
//
// OWNS:
// Seal DOM.
// Create Your Account DOM.
// Welcome to CyberCrowd DOM.
//
// DOES NOT OWN:
// Glass plaque creation.
// Swipe interface.
// Swipe detection.
// Movement.
// Audio.
// Turnstile.
// Email.
// Authentication.
// Routing.
// CSS presentation.

export function installFaceOne() {
  const plaque =
    document.querySelector(".glass-plaque");

  if (!plaque) {
    return false;
  }

  if (
    plaque.querySelector(
      ":scope > .create-account-face-one"
    )
  ) {
    return false;
  }

  const face =
    document.createElement("div");

  face.className =
    "create-account-face-one";

  const seal =
    document.createElement("img");

  seal.className =
    "create-account-seal";

  seal.src =
    "https://pub-081cb3c244be4e09b5e76012567a0b0a.r2.dev/1780664884427.png";

  seal.alt = "";
  seal.setAttribute(
    "aria-hidden",
    "true"
  );

  const title =
    document.createElement("h1");

  title.className =
    "create-account-title";

  title.textContent =
    "Create Your Account";

  const welcome =
    document.createElement("p");

  welcome.className =
    "create-account-welcome";

  welcome.textContent =
    "Welcome to CyberCrowd";

  face.append(
    seal,
    title,
    welcome
  );

  plaque.prepend(face);

  return true;
}
