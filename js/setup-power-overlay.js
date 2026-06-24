// js/setup-power-overlay.js
// CyberCrowd Setup Power Overlay
// Owns visual power-up only.
// No auth. No password storage. No routing authority.

(() => {
  const STATE = {
    idle: "idle",
    awake: "awake",
    charging: "charging",
    matched: "matched",
    shorted: "shorted",
    fired: "fired"
  };

  let root = null;
  let rail = null;
  let pulse = null;
  let text = null;
  let state = STATE.idle;
  let shortTimer = null;

  function ensureOverlay() {
    if (root) return root;

    root = document.createElement("div");
    root.id = "setupPowerOverlay";
    root.className = "setup-power-overlay";
    root.setAttribute("aria-hidden", "true");

    rail = document.createElement("div");
    rail.className = "setup-power-rail";

    pulse = document.createElement("div");
    pulse.className = "setup-power-pulse";

    text = document.createElement("div");
    text.className = "setup-power-text";
    text.textContent = "IDENTITY CIRCUIT";

    root.appendChild(rail);
    root.appendChild(pulse);
    root.appendChild(text);

    const room = document.getElementById("setupRoom") || document.body;
    room.appendChild(root);

    injectStyle();
    return root;
  }

  function injectStyle() {
    if (document.getElementById("setupPowerOverlayStyle")) return;

    const style = document.createElement("style");
    style.id = "setupPowerOverlayStyle";
    style.textContent = `
      .setup-power-overlay {
        position: absolute;
        inset: 0;
        z-index: 57;
        pointer-events: none;
        opacity: 0;
      }

      .setup-power-overlay.awake,
      .setup-power-overlay.charging,
      .setup-power-overlay.matched,
      .setup-power-overlay.shorted,
      .setup-power-overlay.fired {
        opacity: 1;
      }

      .setup-power-overlay.tap .setup-power-rail {
        animation: setup-power-tap 180ms ease-out;
      }

      .setup-power-rail {
        position: absolute;
        left: 50%;
        top: 38.9%;
        width: 0%;
        height: 2px;
        transform: translateX(-50%);
        background: linear-gradient(90deg, transparent, rgba(105,245,255,.95), rgba(118,255,168,.95), transparent);
        box-shadow: 0 0 8px rgba(105,245,255,.9), 0 0 22px rgba(118,255,168,.45);
        opacity: 0;
      }

      .setup-power-overlay.awake .setup-power-rail { width: 18%; opacity: .7; }
      .setup-power-overlay.charging .setup-power-rail { width: 44%; opacity: 1; }
      .setup-power-overlay.matched .setup-power-rail { width: 63%; opacity: 1; animation: setup-power-hum 760ms ease-in-out infinite; }

      .setup-power-overlay.shorted .setup-power-rail {
        width: 52%;
        background: linear-gradient(90deg, transparent, rgba(255,92,132,.98), rgba(255,180,60,.9), transparent);
        animation: setup-power-short 120ms linear infinite;
      }

      .setup-power-overlay.fired .setup-power-rail {
        width: 92%;
        opacity: 1;
        animation: setup-power-fire 780ms ease-out forwards;
      }

      .setup-power-pulse {
        position: absolute;
        left: 69.8%;
        top: 85.3%;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(.2);
        opacity: 0;
        background: radial-gradient(circle, rgba(118,255,168,.98), rgba(0,80,52,.18));
        box-shadow: 0 0 12px rgba(118,255,168,.92), 0 0 34px rgba(118,255,168,.48);
      }

      .setup-power-overlay.matched .setup-power-pulse {
        opacity: 1;
        transform: translate(-50%, -50%) scale(.82);
        animation: setup-power-ready 860ms ease-in-out infinite;
      }

      .setup-power-overlay.fired .setup-power-pulse {
        opacity: 1;
        animation: setup-power-burst 900ms ease-out forwards;
      }

      .setup-power-text {
        position: absolute;
        left: 50%;
        top: 47%;
        transform: translate(-50%, -50%);
        color: rgba(220,255,255,.94);
        font-size: clamp(10px, 1vw, 16px);
        letter-spacing: .28em;
        text-shadow: 0 0 8px rgba(105,245,255,.9), 0 0 20px rgba(118,255,168,.4);
        opacity: 0;
      }

      .setup-power-overlay.awake .setup-power-text,
      .setup-power-overlay.charging .setup-power-text { opacity: .38; }

      .setup-power-overlay.matched .setup-power-text { opacity: .82; }

      .setup-power-overlay.fired .setup-power-text {
        opacity: 1;
        animation: setup-power-text-fire 1.15s ease-out forwards;
      }

      @keyframes setup-power-tap {
        0% { filter: brightness(1); transform: translateX(-50%) scaleX(1); }
        50% { filter: brightness(2.4); transform: translateX(-50%) scaleX(1.08); }
        100% { filter: brightness(1); transform: translateX(-50%) scaleX(1); }
      }

      @keyframes setup-power-hum {
        0%, 100% { filter: brightness(1); }
        50% { filter: brightness(1.7); }
      }

      @keyframes setup-power-short {
        0% { transform: translateX(-50%) translateY(0); opacity: .55; }
        50% { transform: translateX(-50%) translateY(-1px); opacity: 1; }
        100% { transform: translateX(-50%) translateY(1px); opacity: .7; }
      }

      @keyframes setup-power-ready {
        0%, 100% { transform: translate(-50%, -50%) scale(.82); }
        50% { transform: translate(-50%, -50%) scale(1.08); }
      }

      @keyframes setup-power-fire {
        0% { filter: blur(0) brightness(1); }
        35% { filter: blur(1px) brightness(2.4); }
        100% { filter: blur(9px) brightness(.7); opacity: 0; }
      }

      @keyframes setup-power-burst {
        0% { transform: translate(-50%, -50%) scale(.7); opacity: .8; }
        35% { transform: translate(-50%, -50%) scale(2.6); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(7); opacity: 0; }
      }

      @keyframes setup-power-text-fire {
        0% { letter-spacing: .28em; opacity: .8; }
        35% { letter-spacing: .46em; opacity: 1; }
        100% { letter-spacing: .7em; opacity: 0; }
      }
    `;

    document.head.appendChild(style);
  }

  function setState(nextState, label) {
    ensureOverlay();
    state = nextState;
    root.className = `setup-power-overlay ${nextState}`;
    if (label) text.textContent = label;
  }

  function wake() {
    setState(STATE.awake, "IDENTITY CIRCUIT");
  }

  function charge() {
    setState(STATE.charging, "POWERING IDENTITY");
  }

  function tap() {
    ensureOverlay();
    charge();
    root.classList.remove("tap");
    void root.offsetWidth;
    root.classList.add("tap");
  }

  function matched() {
    setState(STATE.matched, "READY");
  }

  function short() {
    window.clearTimeout(shortTimer);
    setState(STATE.shorted, "MISMATCH");
    shortTimer = window.setTimeout(() => {
      if (state === STATE.shorted) charge();
    }, 650);
  }

  function fire() {
    setState(STATE.fired, "IDENTITY POWERED");
  }

  window.SetupPowerOverlay = {
    wake,
    charge,
    tap,
    matched,
    short,
    fire
  };
})();
