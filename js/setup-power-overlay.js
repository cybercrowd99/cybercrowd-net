// js/setup-power-overlay.js
// CyberCrowd Setup Power Overlay
// ONE JOB: visual power movement only.
// No auth. No password storage. No routing. No URL codes.
// 19 password characters = full power rail.
// 19 + 1 = activation fire.

(() => {
  const MAX_POWER = 19;
  const MIN_FIRE = 8;

  let root = null;
  let rail = null;
  let pulse = null;
  let shortTimer = null;

  function clamp(value) {
    const number = Number(value || 0);
    return Math.max(0, Math.min(MAX_POWER, number));
  }

  function getInputs() {
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
      matched: Boolean(password && verify && password === verify && password.length >= MIN_FIRE),
      shorted: Boolean(password && verify && password !== verify)
    };
  }

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

    root.appendChild(rail);
    root.appendChild(pulse);

    const room = document.getElementById("setupRoom") || document.body;
    room.appendChild(root);

    injectStyle();
    wireInputs();
    update();

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
        --setup-power: 0;
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
        left: 50%;
        top: 38.9%;
        width: calc(var(--setup-power) * 92%);
        max-width: 92%;
        height: 2px;
        transform: translateX(-50%);
        border-radius: 999px;
        opacity: 0;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(105, 245, 255, 0.98),
          rgba(118, 255, 168, 0.98),
          transparent
        );
        box-shadow:
          0 0 8px rgba(105, 245, 255, 0.9),
          0 0 22px rgba(118, 255, 168, 0.45);
      }

      .setup-power-overlay.awake .setup-power-rail,
      .setup-power-overlay.charging .setup-power-rail,
      .setup-power-overlay.matched .setup-power-rail,
      .setup-power-overlay.shorted .setup-power-rail,
      .setup-power-overlay.fired .setup-power-rail {
        opacity: 1;
      }

      .setup-power-overlay.charging .setup-power-rail {
        animation: setup-power-hum 760ms ease-in-out infinite;
      }

      .setup-power-overlay.matched .setup-power-rail {
        animation: setup-power-hug 700ms ease-in-out infinite;
      }

      .setup-power-overlay.shorted .setup-power-rail {
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 92, 132, 0.98),
          rgba(255, 180, 60, 0.9),
          transparent
        );
        box-shadow:
          0 0 8px rgba(255, 92, 132, 0.9),
          0 0 22px rgba(255, 92, 132, 0.45);
        animation: setup-power-short 120ms linear infinite;
      }

      .setup-power-overlay.fired .setup-power-rail {
        width: 92%;
        animation: setup-power-fire 780ms ease-out forwards;
      }

      .setup-power-pulse {
        position: absolute;
        left: calc(4% + (var(--setup-power) * 92%));
        top: 38.9%;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0.45);
        opacity: 0;
        background: radial-gradient(
          circle,
          rgba(255, 255, 255, 0.98),
          rgba(105, 245, 255, 0.28)
        );
        box-shadow:
          0 0 12px rgba(105, 245, 255, 0.95),
          0 0 30px rgba(118, 255, 168, 0.42);
      }

      .setup-power-overlay.awake .setup-power-pulse,
      .setup-power-overlay.charging .setup-power-pulse,
      .setup-power-overlay.matched .setup-power-pulse,
      .setup-power-overlay.shorted .setup-power-pulse {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }

      .setup-power-overlay.matched .setup-power-pulse {
        left: 69.8%;
        top: 85.3%;
        animation: setup-power-ready 860ms ease-in-out infinite;
      }

      .setup-power-overlay.shorted .setup-power-pulse {
        background: radial-gradient(
          circle,
          rgba(255, 92, 132, 0.98),
          rgba(80, 0, 30, 0.22)
        );
        box-shadow:
          0 0 12px rgba(255, 92, 132, 0.92),
          0 0 34px rgba(255, 92, 132, 0.44);
        animation: setup-power-node-short 120ms linear infinite;
      }

      .setup-power-overlay.fired .setup-power-pulse {
        left: 69.8%;
        top: 85.3%;
        opacity: 1;
        animation: setup-power-burst 900ms ease-out forwards;
      }

      .setup-power-overlay.tap .setup-power-rail {
        filter: brightness(2.4);
      }

      @keyframes setup-power-hum {
        0%, 100% {
          filter: brightness(1);
        }

        50% {
          filter: brightness(1.7);
        }
      }

      @keyframes setup-power-hug {
        0%, 100% {
          filter: brightness(1);
          transform: translateX(-50%) scaleY(1);
        }

        50% {
          filter: brightness(2);
          transform: translateX(-50%) scaleY(2.2);
        }
      }

      @keyframes setup-power-short {
        0% {
          transform: translateX(-50%) translateY(0);
          opacity: 0.55;
        }

        50% {
          transform: translateX(-50%) translateY(-1px);
          opacity: 1;
        }

        100% {
          transform: translateX(-50%) translateY(1px);
          opacity: 0.7;
        }
      }

      @keyframes setup-power-ready {
        0%, 100% {
          transform: translate(-50%, -50%) scale(0.82);
        }

        50% {
          transform: translate(-50%, -50%) scale(1.08);
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

      @keyframes setup-power-fire {
        0% {
          filter: blur(0) brightness(1);
          opacity: 1;
        }

        35% {
          filter: blur(1px) brightness(2.4);
          opacity: 1;
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

  function setClass(name) {
    ensureOverlay();

    root.className = name
      ? `setup-power-overlay ${name}`
      : "setup-power-overlay";
  }

  function setPower(length) {
    ensureOverlay();

    const power = clamp(length);
    const ratio = power / MAX_POWER;

    root.style.setProperty("--setup-power", String(ratio));
  }

  function update() {
    ensureOverlay();

    const input = getInputs();
    const visiblePower = Math.max(input.passwordLength, input.verifyLength);

    setPower(visiblePower);

    if (!visiblePower) {
      setClass("");
      return;
    }

    if (input.shorted) {
      setClass("shorted");

      window.clearTimeout(shortTimer);
      shortTimer = window.setTimeout(() => {
        update();
      }, 650);

      return;
    }

    if (input.matched) {
      setPower(MAX_POWER);
      setClass("matched");
      return;
    }

    setClass(input.enough ? "charging" : "awake");
  }

  function wireInputs() {
    const passwordInput = document.getElementById("passwordInput");
    const verifyInput = document.getElementById("verifyInput");
    const activateButton = document.getElementById("activateButton");

    if (passwordInput && !passwordInput.dataset.setupPowerOverlay) {
      passwordInput.dataset.setupPowerOverlay = "true";
      passwordInput.addEventListener("input", update);
      passwordInput.addEventListener("focus", update);
    }

    if (verifyInput && !verifyInput.dataset.setupPowerOverlay) {
      verifyInput.dataset.setupPowerOverlay = "true";
      verifyInput.addEventListener("input", update);
      verifyInput.addEventListener("focus", update);
    }

    if (activateButton && !activateButton.dataset.setupPowerOverlay) {
      activateButton.dataset.setupPowerOverlay = "true";

      activateButton.addEventListener("pointerdown", () => {
        update();
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
    update();
  }

  function charge() {
    update();
  }

  function tap() {
    update();
    root.classList.remove("tap");
    void root.offsetWidth;
    root.classList.add("tap");
  }

  function matched() {
    setPower(MAX_POWER);
    setClass("matched");
  }

  function short() {
    setClass("shorted");

    window.clearTimeout(shortTimer);
    shortTimer = window.setTimeout(() => {
      update();
    }, 650);
  }

  function fire() {
    setPower(MAX_POWER);
    setClass("fired");
  }

  function reset() {
    setPower(0);
    setClass("");
  }

  window.SetupPowerOverlay = {
    wake,
    charge,
    tap,
    matched,
    short,
    fire,
    reset,
    update
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureOverlay, { once: true });
  } else {
    ensureOverlay();
  }
})();
