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
// Install visible Sequence #1 face.
//
// FUNCTION:
// installFaceOne()
//
// HUMAN SEES:
//
// seal
//
// Welcome To Cybercrowd
//
// Create your account
//
// Swipe

export function installFaceOne() {
  const plaque =
    document.querySelector(
      ".glass-plaque"
    );

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
    "Welcome To Cybercrowd";

  const welcome =
    document.createElement("p");

  welcome.className =
    "create-account-welcome";

  welcome.textContent =
    "Create your account";

  face.append(
    seal,
    title,
    welcome
  );

  plaque.prepend(face);

  return true;
}
