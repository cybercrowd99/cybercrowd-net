// CYBERCROWD
//
// REPO: cybercrowd99/cybercrowd-net
// PATH: create-account-swipe-cue.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// JOB:
// Present the Sequence #1 swipe interface
// inside the real glass plaque.
//
// FUNCTION:
// installSwipeCue()
//
// OWNS:
// Swipe interface DOM.
// See-through swipe pill.
// Gold directional chevrons.
// 24kt gold SWIPE lettering.
// Black outline on every SWIPE letter.
//
// DOES NOT OWN:
// Plaque creation.
// Title.
// Welcome.
// Seal.
// Swipe detection.
// Pointer events.
// Movement.
// Audio.
// Turnstile.
// Email.
// Authentication.
// Routing.

export function installSwipeCue() {
  const plaque =
    document.querySelector(".glass-plaque");

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

  cue.setAttribute(
    "aria-label",
    "Swipe"
  );

  cue.innerHTML = `
    <svg
      viewBox="0 0 600 240"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="cybercrowdSwipeGold"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stop-color="#FFF3A8"
          />

          <stop
            offset="35%"
            stop-color="#FFD700"
          />

          <stop
            offset="70%"
            stop-color="#D4AF37"
          />

          <stop
            offset="100%"
            stop-color="#916819"
          />
        </linearGradient>

        <linearGradient
          id="cybercrowdSwipeGlass"
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
        fill="url(#cybercrowdSwipeGlass)"
        stroke="#D4A94A"
        stroke-width="2.5"
      />

      <path
        d="M105 120 L130 95 M105 120 L130 145"
        stroke="#D4A94A"
        stroke-width="6"
        stroke-linecap="round"
        fill="none"
        opacity="0.4"
      />

      <path
        d="M125 120 L150 95 M125 120 L150 145"
        stroke="#D4A94A"
        stroke-width="6"
        stroke-linecap="round"
        fill="none"
        opacity="0.7"
      />

      <path
        d="M145 120 L170 95 M145 120 L170 145"
        stroke="#D4A94A"
        stroke-width="6"
        stroke-linecap="round"
        fill="none"
      />

      <path
        d="M495 120 L470 95 M495 120 L470 145"
        stroke="#D4A94A"
        stroke-width="6"
        stroke-linecap="round"
        fill="none"
        opacity="0.4"
      />

      <path
        d="M475 120 L450 95 M475 120 L450 145"
        stroke="#D4A94A"
        stroke-width="6"
        stroke-linecap="round"
        fill="none"
        opacity="0.7"
      />

      <path
        d="M455 120 L430 95 M455 120 L430 145"
        stroke="#D4A94A"
        stroke-width="6"
        stroke-linecap="round"
        fill="none"
      />

      <text
        x="300"
        y="140"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="56"
        font-weight="900"
        letter-spacing="10"
        fill="url(#cybercrowdSwipeGold)"
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
