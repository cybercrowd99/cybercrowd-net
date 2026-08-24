// CYBERCROWD
//
// FILE:
// create-account-swipe-cue.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Install the approved Sequence #1 SWIPE interface.
//
// FUNCTION:
// installSwipeCue()

export function installSwipeCue() {
  const plaque =
    document.querySelector(
      ".glass-plaque"
    );

  if (!plaque) {
    return false;
  }

  if (
    document.getElementById(
      "create-account-swipe-cue"
    )
  ) {
    return false;
  }

  const cue =
    document.createElement("div");

  cue.id =
    "create-account-swipe-cue";

  cue.innerHTML = `
<svg
  width="600"
  height="240"
  viewBox="0 0 600 240"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <linearGradient
      id="goldText"
      x1="0%"
      y1="0%"
      x2="0%"
      y2="100%"
    >
      <stop
        offset="0%"
        stop-color="#FFD700"
      />
      <stop
        offset="50%"
        stop-color="#FFC300"
      />
      <stop
        offset="100%"
        stop-color="#E6A800"
      />
    </linearGradient>

    <linearGradient
      id="glassFill"
      x1="0%"
      y1="0%"
      x2="0%"
      y2="100%"
    >
      <stop
        offset="0%"
        stop-color="#FFFFFF"
        stop-opacity="0.18"
      />
      <stop
        offset="100%"
        stop-color="#FFFFFF"
        stop-opacity="0.04"
      />
    </linearGradient>
  </defs>

  <rect
    x="30"
    y="50"
    width="540"
    height="140"
    rx="70"
    ry="70"
    fill="url(#glassFill)"
    stroke="#D4A94A"
    stroke-width="2.5"
  />

  <path
    d="M105,120 L130,95"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
    opacity="0.4"
  />

  <path
    d="M105,120 L130,145"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
    opacity="0.4"
  />

  <path
    d="M125,120 L150,95"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
    opacity="0.7"
  />

  <path
    d="M125,120 L150,145"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
    opacity="0.7"
  />

  <path
    d="M145,120 L170,95"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
  />

  <path
    d="M145,120 L170,145"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
  />

  <path
    d="M495,120 L470,95"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
    opacity="0.4"
  />

  <path
    d="M495,120 L470,145"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
    opacity="0.4"
  />

  <path
    d="M475,120 L450,95"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
    opacity="0.7"
  />

  <path
    d="M475,120 L450,145"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
    opacity="0.7"
  />

  <path
    d="M455,120 L430,95"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
  />

  <path
    d="M455,120 L430,145"
    stroke="#D4A94A"
    stroke-width="6"
    stroke-linecap="round"
    fill="none"
  />

  <text
    x="300"
    y="140"
    font-family="Arial, Helvetica, sans-serif"
    font-size="56"
    font-weight="900"
    fill="url(#goldText)"
    text-anchor="middle"
    letter-spacing="10"
    stroke="#000000"
    stroke-width="3"
    paint-order="stroke fill"
  >
    SWIPE
  </text>
</svg>
  `;

  plaque.appendChild(cue);

  return true;
}
