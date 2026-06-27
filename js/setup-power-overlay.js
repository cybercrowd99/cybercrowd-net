// js/setup-power-overlay.js
// CyberCrowd Setup Power Overlay
// Owns visual power-up only.
// No auth. No password storage. No routing authority.
// No URL tokens. No setup.html rewrite.
// 19 password characters = 19 power slots.
// 19 + 1 = activation fire node.

(() => {
  const MAX_POWER = 19;
  const MIN_FIRE = 8;

  const STATE = {
    idle: "idle",
    awake: "awake",
    charging: "charging",
    matched: "matched",
    shorted: "shorted",
    fired: "fired"
  };

  let root = null;
  let passwordRail = null;
  let verifyRail = null;
  let bridge = null;
  let fireNode = null;
  let passwordComet = null;
  let verifyComet = null;
  let state = STATE.idle;
  let shortTimer = null;

  function clampPower(value) {
    const number = Number(value || 0);
    return Math.max(0, Math.min(MAX_POWER, number));
  }

  function makeSlot(index, lane) {
    const node = document.createElement("i");
    node.className = `setup-power-slot ${lane}`;
    node.dataset.slot = String(index);
    return node;
  }

  function makeRail(className, lane) {
    const rail = document.createElement("div");
    rail.className = className;

    for (let i = 1; i <= MAX_POWER; i += 1) {
      rail.appendChild(makeSlot(i, lane));
    }

    return rail;
  }

  function ensureOverlay() {
    if (root) return root;

    root = document.createElement("div");
    root.id = "setupPowerOverlay";
    root.className = "setup-power-overlay";
    root.setAttribute("aria-hidden", "true");

    passwordRail = makeRail("setup-power-rail password", "password");
    verifyRail = makeRail("setup-power-rail verify", "verify");

    passwordComet = document.createElement("b");
    passwordComet.className = "setup-power-comet password";

    verifyComet = document.createElement("b");
    verifyComet.className = "setup-power-comet verify";

    bridge = document.createElement("div");
    bridge.className = "setup-power-bridge";

    fireNode = document.createElement("div");
    fireNode.className = "setup-power-fire-node";

    root.appendChild(passwordRail);
    root.appendChild(verifyRail);
    root.appendChild(passwordComet);
    root.appendChild(verifyComet);
    root.appendChild(bridge);
    root.appendChild(fireNode);

    const room = document.getElementById("setupRoom") || document.body;
    room.appendChild(root);

    injectStyle();
    wireInputs();

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

      .setup-power-rail {
        position: absolute;
        width: 34%;
        height: 7.4%;
        display: grid;
        grid-template-columns: repeat(19, 1fr);
        align-items: center;
        gap: 0.28%;
        opacity: 0.92;
      }

      .setup-power-rail.password {
        left: 50.5%;
        top: 54.2%;
        transform: translate(-50%, -50%);
      }

      .setup-power-rail.verify {
        left: 49.8%;
        top: 69.3%;
        transform: translate(-50%, -50%);
      }

      .setup-power-slot {
        display: block;
        width: 100%;
        height: 2px;
        border-radius: 999px;
        background: rgba(90, 120, 130, 0.16);
        box-shadow: none;
        transform: scaleY(1);
        opacity: 0.38;
        transition:
          opacity 160ms ease,
          background 160ms ease,
          box-shadow 160ms ease,
          transform 160ms ease;
      }

      .setup-power-slot.on {
        opacity: 1;
        transform: scaleY(2.25);
        background: rgba(105, 245, 255, 0.96);
        box-shadow:
          0 0 6px rgba(105, 245, 255, 0.92),
          0 0 18px rgba(105, 245, 255, 0.42);
      }

      .setup-power-slot.valid {
        background: rgba(118, 255, 168, 0.98);
        box-shadow:
          0 0 7px rgba(118, 255, 168, 0.95),
          0 0 20px rgba(118, 255, 168, 0.44);
      }

      .setup-power-slot.bad {
        background: rgba(255, 92, 132, 0.98);
        box-shadow:
          0 0 7px rgba(255, 92, 132, 0.92),
          0 0 18px rgba(255, 92, 132, 0.38);
        animation: setup-power-shiver 120ms linear infinite;
      }

      .setup-power-comet {
        position: absolute;
        width: 13px;
        height: 13px;
        border-radius: 50%;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
        background: radial-gradient(circle, rgba(255,255,255,0.98), rgba(105,245,255,0.2));
        box-shadow:
          0 0 12px rgba(105, 245, 255, 0.95),
          0 0 30px rgba(118, 255, 168, 0.42);
        transition:
          left 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
          top 180ms cubic-bezier(0.34, 1.56, 0.64, 1),
          opacity 140ms ease,
          transform 160ms ease;
      }

      .setup-power-comet.on {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }

      .setup-power-bridge {
        position: absolute;
        left: 49.8%;
        top: 61.75%;
        width: 1.3px;
        height: 0%;
        transform: translate(-50%, -50%);
        border-radius: 999px;
        opacity: 0;
        background: linear-gradient(
          180deg,
          rgba(105, 245, 255, 0.1),
          rgba(105, 245, 255, 0.95),
          rgba(118, 255, 168, 0.95),
          rgba(255, 0, 102, 0.2)
        );
        box-shadow:
          0 0 8px rgba(105, 245, 255, 0.8),
          0 0 20px rgba(118, 255, 168, 0.34);
        transition:
          height 240ms ease,
          opacity 160ms ease;
      }

      .setup-power-overlay.charging .setup-power-bridge,
      .setup-power-overlay.matched .setup-power-bridge {
        opacity: 1;
        height: 12%;
      }

      .setup-power-overlay.matched .setup-power-bridge {
        animation: setup-power-hug 700ms ease-in-out infinite;
      }

      .setup-power-fire-node {
        position: absolute;
        left: 69.8%;
        top: 85.3%;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0.2);
        opacity: 0;
        background: radial-gradient(circle, rgba(118,255,168,.98), rgba(0,80,52,.18));
        box-shadow:
          0 0 12px rgba(118,255,168,.92),
          0 0 34px rgba(118,255,168,.48);
        transition:
          opacity 180ms ease,
          transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .setup-power-overlay.matched .setup-power-fire-node {
        opacity: 1;
        transform: translate(-50%, -50%) scale(0.82);
        animation: setup-power-ready 860ms ease-in-out infinite;
      }

      .setup-power-overlay.shorted .setup-power-fire-node {
        opacity: 0.85;
        background: radial-gradient(circle, rgba(255,92,132,.98), rgba(80,0,30,.2));
        box-shadow:
          0 0 12px rgba(255,92,132,.92),
          0 0 34px rgba(255,92,132,.44);
        animation: setup-power-node-short 120ms linear infinite;
      }

      .setup-power-overlay.fired .setup-power-fire-node {
        opacity: 1;
        animation: setup-power-burst 900ms ease-out forwards;
      }

      .setup-power-overlay.fired .setup-power-slot.on,
      .setup-power-overlay.fired .setup-power-slot.valid {
        animation: setup-power-melt 680ms ease-out forwards;
      }

      .setup-power-overlay.fired .setup-power-bridge {
        height: 33%;
        opacity: 1;
        animation: setup-power-fire-bridge 780ms ease-out forwards;
      }

      @keyframes setup-power-ready {
        0%, 100% {
          transform: translate(-50%, -50%) scale(0.82);
        }

        50% {
          transform: translate(-50%, -50%) scale(1.08);
        }
      }

      @keyframes setup-power-hug {
        0%, 100% {
          filter: brightness(1);
          transform: translate(-50%, -50%) scaleX(1);
        }

        50% {
          filter: brightness(1.9);
          transform: translate(-50%, -50%) scaleX(2.2);
        }
      }

      @keyframes setup-power-shiver {
        0% {
          transform: translateY(0) scaleY(2.2);
        }

        50% {
          transform: translateY(-1px) scaleY(2.8);
        }

        100% {
          transform: translateY(1px) scaleY(2.1);
        }
      }

      @keyframes setup-power-node-short {
        0% {
          transform: translate(-50%, -50%) scale(0.72);
        }

        50% {
          transform: translate(-50%, -50%) scale(1.05);
        }

        100% {
          transform: translate(-50%, -50%) scale(0.82);
        }
      }

      @keyframes setup-power-melt {
        0% {
          filter: blur(0) brightness(1);
          opacity: 1;
        }

        45% {
          filter: blur(1px) brightness(2.1);
          opacity: 1;
        }

        100% {
          filter: blur(5px) brightness(0.7);
          opacity: 0.18;
        }
      }

      @keyframes setup-power-fire-bridge {
        0% {
          filter: blur(0) brightness(1);
        }

        35% {
          filter: blur(1px) brightness(2.4);
        }

        100% {
          filter: blur(9px) brightness(0.7);
          opacity: 0;
        }
      }

      @keyframes setup-power-burst {
        0% {
          transform: translate(-50%, -50%) scale(0.7);
          opacity: 0.8;
        }

        35% {
          transform: translate(-50%, -50%) scale(2.6);
          opacity: 1;
        }

        100% {
          transform: translate(-50%, -50%) scale(7);
          opacity: 0;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function slotPercent(length) {
    const power = clampPower(length);

    if (power <= 0) return null;

    return ((power - 0.5) / MAX_POWER) * 100;
  }

  function moveComet(comet, railElement, length) {
    if (!comet || !railElement) return;

    const percent = slotPercent(length);

    if (percent === null) {
      comet.classList.remove("on");
      return;
    }

    const railClass = railElement.classList.contains("password") ? "password" : "verify";
    const top = railClass === "password" ? 54.2 : 69.3;
    const railLeft = railClass === "password" ? 50.5 : 49.8;
    const railWidth = 34;
    const left = railLeft - railWidth / 2 + (railWidth * percent) / 100;

    comet.style.left = `${left}%`;
    comet.style.top = `${top}%`;
    comet.classList.add("on");
  }

  function paintRail(railElement, length, mode) {
    if (!railElement) return;

    const power = clampPower(length);
    const slots = [...railElement.querySelectorAll(".setup-power-slot")];

    slots.forEach((slot, index) => {
      const slotNumber = index + 1;
      slot.classList.remove("on", "valid", "bad");

      if (slotNumber <= power) {
        slot.classList.add("on");

        if (power >= MIN_FIRE && mode === "valid") {
          slot.classList.add("valid");
        }

        if (mode === "bad") {
          slot.classList.add("bad");
        }
      }
    });
  }

  function readInputs() {
    const passwordInput = document.getElementById("passwordInput");
    const verifyInput = document.getElementById("verifyInput");

    const password = passwordInput ? String(passwordInput.value || "").slice(0, MAX_POWER) : "";
    const verify = verifyInput ? String(verifyInput.value || "").slice(0, MAX_POWER) : "";

    return {
      password,
      verify,
      passwordLength: password.length,
      verifyLength: verify.length,
      enough: password.length >= MIN_FIRE,
      same: Boolean(password && verify && password === verify),
      mismatch: Boolean(password && verify && password !== verify)
    };
  }

  function updateFromInputs() {
    ensureOverlay();

    const input = readInputs();

    if (!input.passwordLength && !input.verifyLength) {
      setState(STATE.idle);
      paintRail(passwordRail, 0, "");
      paintRail(verifyRail, 0, "");
      moveComet(passwordComet, passwordRail, 0);
      moveComet(verifyComet, verifyRail, 0);
      return;
    }

    if (input.mismatch) {
      setState(STATE.shorted);
      paintRail(passwordRail, input.passwordLength, input.enough ? "valid" : "");
      paintRail(verifyRail, input.verifyLength, "bad");
      moveComet(passwordComet, passwordRail, input.passwordLength);
      moveComet(verifyComet, verifyRail, input.verifyLength);

      window.clearTimeout(shortTimer);
      shortTimer = window.setTimeout(() => {
        if (state === STATE.shorted) {
          setState(STATE.charging);
        }
      }, 650);

      return;
    }

    if (input.same && input.enough) {
      setState(STATE.matched);
      paintRail(passwordRail, input.passwordLength, "valid");
      paintRail(verifyRail, input.verifyLength, "valid");
      moveComet(passwordComet, passwordRail, input.passwordLength);
      moveComet(verifyComet, verifyRail, input.verifyLength);
      return;
    }

    setState(input.enough ? STATE.charging : STATE.awake);
    paintRail(passwordRail, input.passwordLength, input.enough ? "valid" : "");
    paintRail(verifyRail, input.verifyLength, "");
    moveComet(passwordComet, passwordRail, input.passwordLength);
    moveComet(verifyComet, verifyRail, input.verifyLength);
  }

  function setState(nextState) {
    ensureOverlay();
    state = nextState;
    root.className = nextState === STATE.idle
      ? "setup-power-overlay"
      : `setup-power-overlay ${nextState}`;
  }

  function wireInputs() {
    const passwordInput = document.getElementById("passwordInput");
    const verifyInput = document.getElementById("verifyInput");
    const activateButton = document.getElementById("activateButton");

    if (passwordInput && !passwordInput.dataset.setupPowerWired) {
      passwordInput.dataset.setupPowerWired = "true";
      passwordInput.addEventListener("input", updateFromInputs);
      passwordInput.addEventListener("focus", updateFromInputs);
    }

    if (verifyInput && !verifyInput.dataset.setupPowerWired) {
      verifyInput.dataset.setupPowerWired = "true";
      verifyInput.addEventListener("input", updateFromInputs);
      verifyInput.addEventListener("focus", updateFromInputs);
    }

    if (activateButton && !activateButton.dataset.setupPowerWired) {
      activateButton.dataset.setupPowerWired = "true";
      activateButton.addEventListener("pointerdown", () => {
        updateFromInputs();
        root.classList.add("tap");
      });

      activateButton.addEventListener("pointerup", () => {
        root.classList.remove("tap");
      });

      activateButton.addEventListener("pointercancel", () => {
        root.classList.remove("tap");
      });
    }
  }

  function wake() {
    ensureOverlay();
    updateFromInputs();
  }

  function charge() {
    ensureOverlay();
    updateFromInputs();
  }

  function tap() {
    ensureOverlay();
    updateFromInputs();
    root.classList.remove("tap");
    void root.offsetWidth;
    root.classList.add("tap");
  }

  function matched() {
    ensureOverlay();
    setState(STATE.matched);
  }

  function short() {
    ensureOverlay();
    setState(STATE.shorted);

    window.clearTimeout(shortTimer);
    shortTimer = window.setTimeout(() => {
      if (state === STATE.shorted) updateFromInputs();
    }, 650);
  }

  function fire() {
    ensureOverlay();
    setState(STATE.fired);
  }

  function reset() {
    ensureOverlay();
    setState(STATE.idle);
    paintRail(passwordRail, 0, "");
    paintRail(verifyRail, 0, "");
    moveComet(passwordComet, passwordRail, 0);
    moveComet(verifyComet, verifyRail, 0);
  }

  window.SetupPowerOverlay = {
    wake,
    charge,
    tap,
    matched,
    short,
    fire,
    reset,
    update: updateFromInputs
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureOverlay, { once: true });
  } else {
    ensureOverlay();
  }
})();
