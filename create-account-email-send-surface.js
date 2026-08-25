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
// SEQUENCE:
// #3
//
// JOB:
// Create the approved Enter Email + Send human-action surface
// inside the Sequence #3 glass plaque.
//
// FUNCTION:
// installEmailSendSurface()
//
// INPUT:
// cybercrowd:face-two-arrived
//
// LOCKED VISUALS:
// Approved ENTER YOUR EMAIL HERE decal.
// Approved SEND decal.
//
// INSTRUCTIONS:
// Enter your email.
// Press SEND.
// Check your email right away.
// You must verify within five minutes.
// If you wait too long, it will EXPIRE.
//
// GLASS EFFECT:
// Gold rim.
// Gold Matrix rain emitted from the four glass edges only.
// Gold sparkle shedding from the four glass edges.
// Wind-gust drift instead of rigid straight-down rain.
// Effect remains clipped to the glass.
// Effect remains behind instructions, email surface, and SEND.
//
// ENTER ACTION:
// ENTER decal
// -> one human touch
// -> decal disappears
// -> same footprint becomes writable email surface.
//
// SEND ACTION:
// SEND decal
// -> one human touch.
//
// ASSET RULE:
// Approved button decals are loaded from CyberCrowd R2.
// No embedded BASE64 graphics.

export function installEmailSendSurface() {
  const APPROVED_ENTER_EMAIL_DECAL =
    "https://pub-081cb3c244be4e09b5e76012567a0b0a.r2.dev/file_enter-email-here.png";

  const APPROVED_SEND_DECAL =
    "https://pub-081cb3c244be4e09b5e76012567a0b0a.r2.dev/file_send-email.png";

  window.addEventListener(
    "cybercrowd:face-two-arrived",
    () => {
      const plaque =
        document.querySelector(
          ".glass-plaque-three"
        );

      if (!plaque) {
        return;
      }

      if (
        document.getElementById("email-invite") ||
        document.getElementById("email") ||
        document.getElementById("sendButton") ||
        document.getElementById("send-waiting")
      ) {
        return;
      }

      /*
       * GOLD GLASS RIM
       */
      if (
        window.getComputedStyle(plaque).position ===
        "static"
      ) {
        plaque.style.position =
          "relative";
      }

      plaque.style.isolation =
        "isolate";

      plaque.style.border =
        "2px solid rgba(233, 201, 121, 0.96)";

      plaque.style.boxShadow =
        "0 0 5px rgba(255, 240, 174, 0.95), " +
        "0 0 12px rgba(233, 201, 121, 0.62), " +
        "inset 0 0 8px rgba(255, 237, 166, 0.35)";

      /*
       * FOUR-SURFACE GOLD MATRIX / SPARKLE LAYER
       */
      const rainLayer =
        document.createElement("div");

      rainLayer.className =
        "sequence-three-gold-rain";

      rainLayer.setAttribute(
        "aria-hidden",
        "true"
      );

      rainLayer.style.position =
        "absolute";

      rainLayer.style.inset =
        "0";

      rainLayer.style.overflow =
        "hidden";

      rainLayer.style.borderRadius =
        "inherit";

      rainLayer.style.pointerEvents =
        "none";

      rainLayer.style.zIndex =
        "1";

      rainLayer.style.userSelect =
        "none";

      plaque.appendChild(
        rainLayer
      );

      const particles = [];

      const matrixGlyphs = [
        "0",
        "1",
        "|",
        "+",
        "<",
        ">",
        "[",
        "]",
        ":"
      ];

      const sparkleGlyphs = [
        "✦",
        "✧",
        "⋆",
        "·"
      ];

      let lastFrame =
        performance.now();

      let lastEmission =
        lastFrame;

      let gust =
        0;

      let gustTarget =
        0;

      let nextGustChange =
        lastFrame + 1100;

      const maximumParticles =
        72;

      const emitParticle =
        (edge) => {
          if (
            particles.length >=
            maximumParticles
          ) {
            return;
          }

          const rect =
            rainLayer.getBoundingClientRect();

          if (
            rect.width <= 0 ||
            rect.height <= 0
          ) {
            return;
          }

          const sparkle =
            Math.random() < 0.22;

          const particle =
            document.createElement("span");

          particle.textContent =
            sparkle
              ? sparkleGlyphs[
                  Math.floor(
                    Math.random() *
                    sparkleGlyphs.length
                  )
                ]
              : matrixGlyphs[
                  Math.floor(
                    Math.random() *
                    matrixGlyphs.length
                  )
                ];

          particle.style.position =
            "absolute";

          particle.style.left =
            "0";

          particle.style.top =
            "0";

          particle.style.margin =
            "0";

          particle.style.padding =
            "0";

          particle.style.pointerEvents =
            "none";

          particle.style.whiteSpace =
            "pre";

          particle.style.fontFamily =
            "monospace";

          particle.style.fontWeight =
            sparkle
              ? "700"
              : "600";

          particle.style.fontSize =
            sparkle
              ? `${7 + Math.random() * 8}px`
              : `${7 + Math.random() * 6}px`;

          particle.style.lineHeight =
            "1";

          particle.style.color =
            sparkle
              ? "rgba(255, 244, 188, 0.98)"
              : "rgba(233, 201, 121, 0.88)";

          particle.style.textShadow =
            sparkle
              ? "0 0 4px rgba(255,245,190,1), 0 0 9px rgba(233,201,121,0.95)"
              : "0 0 4px rgba(233,201,121,0.85)";

          particle.style.willChange =
            "transform, opacity";

          let x = 0;
          let y = 0;
          let vx = 0;
          let vy = 0;

          if (edge === 0) {
            x =
              Math.random() *
              rect.width;

            y =
              0;

            vx =
              -4 +
              Math.random() * 8;

            vy =
              26 +
              Math.random() * 35;
          }

          if (edge === 1) {
            x =
              rect.width - 1;

            y =
              Math.random() *
              rect.height;

            vx =
              -12 -
              Math.random() * 12;

            vy =
              22 +
              Math.random() * 36;
          }

          if (edge === 2) {
            x =
              Math.random() *
              rect.width;

            y =
              rect.height - 1;

            vx =
              -5 +
              Math.random() * 10;

            vy =
              -18 -
              Math.random() * 18;
          }

          if (edge === 3) {
            x =
              0;

            y =
              Math.random() *
              rect.height;

            vx =
              12 +
              Math.random() * 12;

            vy =
              22 +
              Math.random() * 36;
          }

          const lifetime =
            sparkle
              ? 900 +
                Math.random() * 900
              : 1300 +
                Math.random() * 1700;

          const item = {
            element: particle,
            x,
            y,
            vx,
            vy,
            age: 0,
            lifetime,
            phase:
              Math.random() *
              Math.PI *
              2,
            flutter:
              4 +
              Math.random() * 9
          };

          rainLayer.appendChild(
            particle
          );

          particles.push(
            item
          );
        };

      const animateRain =
        (now) => {
          const dt =
            Math.min(
              (now - lastFrame) /
                1000,
              0.04
            );

          lastFrame =
            now;

          if (
            now >= nextGustChange
          ) {
            gustTarget =
              -34 +
              Math.random() * 68;

            nextGustChange =
              now +
              850 +
              Math.random() * 2100;
          }

          gust +=
            (
              gustTarget -
              gust
            ) *
            Math.min(
              1,
              dt * 1.8
            );

          if (
            now - lastEmission >
            65
          ) {
            emitParticle(0);
            emitParticle(1);
            emitParticle(2);
            emitParticle(3);

            lastEmission =
              now;
          }

          for (
            let i =
              particles.length - 1;
            i >= 0;
            i -= 1
          ) {
            const particle =
              particles[i];

            particle.age +=
              dt * 1000;

            particle.vy +=
              18 * dt;

            particle.vx +=
              gust *
              dt *
              0.34;

            const flutter =
              Math.sin(
                now * 0.004 +
                particle.phase
              ) *
              particle.flutter;

            particle.x +=
              (
                particle.vx +
                flutter
              ) *
              dt;

            particle.y +=
              particle.vy *
              dt;

            const progress =
              particle.age /
              particle.lifetime;

            const opacity =
              progress < 0.16
                ? progress / 0.16
                : Math.max(
                    0,
                    1 -
                      (
                        progress -
                        0.16
                      ) /
                      0.84
                  );

            particle.element.style.opacity =
              `${opacity}`;

            particle.element.style.transform =
              `translate3d(${particle.x}px, ${particle.y}px, 0)`;

            if (
              particle.age >=
                particle.lifetime ||
              particle.x < -30 ||
              particle.x >
                rainLayer.clientWidth +
                  30 ||
              particle.y < -30 ||
              particle.y >
                rainLayer.clientHeight +
                  30
            ) {
              particle.element.remove();

              particles.splice(
                i,
                1
              );
            }
          }

          requestAnimationFrame(
            animateRain
          );
        };

      requestAnimationFrame(
        animateRain
      );

      /*
       * HUMAN-ACTION SURFACE
       */
      const entryForm =
        document.createElement("div");

      entryForm.className =
        "entry-form";

      entryForm.style.zIndex =
        "5";

      const instructions =
        document.createElement("div");

      instructions.className =
        "email-send-instructions";

      instructions.setAttribute(
        "aria-label",
        "Email verification instructions"
      );

      instructions.innerHTML =
        "Enter your email.<br>" +
        "Press SEND.<br>" +
        "Check your email right away.<br>" +
        "You must verify within five minutes.<br>" +
        "If you wait too long, it will <strong>EXPIRE</strong>.";

      instructions.style.position =
        "absolute";

      instructions.style.top =
        "19%";

      instructions.style.left =
        "50%";

      instructions.style.transform =
        "translate(-50%, -50%) translateZ(4px)";

      instructions.style.width =
        "min(88%, 460px)";

      instructions.style.margin =
        "0";

      instructions.style.padding =
        "0";

      instructions.style.color =
        "#2a2118";

      instructions.style.font =
        "inherit";

      instructions.style.fontSize =
        "clamp(0.82rem, 2.2vw, 1rem)";

      instructions.style.fontWeight =
        "600";

      instructions.style.lineHeight =
        "1.45";

      instructions.style.letterSpacing =
        "0.02em";

      instructions.style.textAlign =
        "center";

      instructions.style.zIndex =
        "7";

      instructions.style.pointerEvents =
        "none";

      /*
       * ENTER EMAIL HUMAN TOUCH
       */
      const emailInvite =
        document.createElement("button");

      emailInvite.id =
        "email-invite";

      emailInvite.className =
        "email-field";

      emailInvite.type =
        "button";

      emailInvite.setAttribute(
        "aria-label",
        "Enter your email here"
      );

      emailInvite.style.padding =
        "0";

      emailInvite.style.border =
        "0";

      emailInvite.style.overflow =
        "hidden";

      emailInvite.style.backgroundImage =
        `url("${APPROVED_ENTER_EMAIL_DECAL}")`;

      emailInvite.style.backgroundSize =
        "contain";

      emailInvite.style.backgroundPosition =
        "center";

      emailInvite.style.backgroundRepeat =
        "no-repeat";

      emailInvite.style.backgroundColor =
        "transparent";

      emailInvite.style.color =
        "transparent";

      emailInvite.style.cursor =
        "pointer";

      emailInvite.style.zIndex =
        "7";

      const email =
        document.createElement("input");

      email.id =
        "email";

      email.className =
        "email-field";

      email.type =
        "email";

      email.name =
        "email";

      email.autocomplete =
        "email";

      email.autocapitalize =
        "none";

      email.spellcheck =
        false;

      email.placeholder =
        "";

      email.setAttribute(
        "aria-label",
        "Email address"
      );

      email.hidden =
        true;

      email.style.zIndex =
        "7";

      /*
       * SEND HUMAN TOUCH
       */
      const sendButton =
        document.createElement("button");

      sendButton.id =
        "sendButton";

      sendButton.type =
        "button";

      sendButton.disabled =
        true;

      sendButton.setAttribute(
        "aria-disabled",
        "true"
      );

      sendButton.setAttribute(
        "aria-label",
        "Send"
      );

      sendButton.style.padding =
        "0";

      sendButton.style.border =
        "0";

      sendButton.style.overflow =
        "hidden";

      sendButton.style.backgroundImage =
        `url("${APPROVED_SEND_DECAL}")`;

      sendButton.style.backgroundSize =
        "contain";

      sendButton.style.backgroundPosition =
        "center";

      sendButton.style.backgroundRepeat =
        "no-repeat";

      sendButton.style.backgroundColor =
        "transparent";

      sendButton.style.color =
        "transparent";

      sendButton.style.cursor =
        "default";

      sendButton.style.zIndex =
        "7";

      /*
       * SECOND SEND STATE
       *
       * NOT A HUMAN TOUCH.
       * NOT A SECOND SEND.
       * NOT EMAIL TRANSMISSION.
       */
      const sendWaiting =
        document.createElement("div");

      sendWaiting.id =
        "send-waiting";

      sendWaiting.setAttribute(
        "role",
        "status"
      );

      sendWaiting.setAttribute(
        "aria-live",
        "polite"
      );

      sendWaiting.setAttribute(
        "aria-label",
        "Sending email"
      );

      sendWaiting.textContent =
        "SENDING";

      sendWaiting.hidden =
        true;

      sendWaiting.style.position =
        "absolute";

      sendWaiting.style.top =
        "68%";

      sendWaiting.style.left =
        "50%";

      sendWaiting.style.transform =
        "translate(-50%, -50%) translateZ(4px)";

      sendWaiting.style.width =
        "min(72%, 360px)";

      sendWaiting.style.minHeight =
        "64px";

      sendWaiting.style.display =
        "none";

      sendWaiting.style.placeItems =
        "center";

      sendWaiting.style.padding =
        "0 24px";

      sendWaiting.style.border =
        "1px solid rgba(82, 53, 20, 0.90)";

      sendWaiting.style.borderRadius =
        "999px";

      sendWaiting.style.background =
        "rgba(233, 201, 121, 0.24)";

      sendWaiting.style.backdropFilter =
        "blur(8px)";

      sendWaiting.style.color =
        "#e9c979";

      sendWaiting.style.font =
        "inherit";

      sendWaiting.style.fontSize =
        "18px";

      sendWaiting.style.fontWeight =
        "700";

      sendWaiting.style.letterSpacing =
        "0.12em";

      sendWaiting.style.textAlign =
        "center";

      sendWaiting.style.pointerEvents =
        "none";

      sendWaiting.style.userSelect =
        "none";

      sendWaiting.style.zIndex =
        "7";

      sendWaiting.style.boxShadow =
        "0 0 8px rgba(233, 201, 121, 0.48), " +
        "inset 0 0 10px rgba(255, 240, 174, 0.16)";

      /*
       * ENTER graphic
       * -> one human touch
       * -> same footprint becomes writable input.
       */
      emailInvite.addEventListener(
        "click",
        () => {
          emailInvite.replaceWith(
            email
          );

          email.hidden =
            false;

          email.focus();
        },
        { once: true }
      );

      /*
       * Typing prepares SEND.
       */
      email.addEventListener(
        "input",
        () => {
          const hasValue =
            email.value.trim().length >
            0;

          sendButton.disabled =
            !hasValue;

          sendButton.setAttribute(
            "aria-disabled",
            hasValue
              ? "false"
              : "true"
          );

          sendButton.style.cursor =
            hasValue
              ? "pointer"
              : "default";
        }
      );

      /*
       * ONE SEND TOUCH.
       *
       * Existing send-action file owns
       * the SEND click boundary.
       */
      window.addEventListener(
        "cybercrowd:send-requested",
        () => {
          if (
            !sendButton.isConnected
          ) {
            return;
          }

          sendButton.replaceWith(
            sendWaiting
          );

          sendWaiting.hidden =
            false;

          sendWaiting.style.display =
            "grid";

          email.disabled =
            true;

          email.setAttribute(
            "aria-disabled",
            "true"
          );
        },
        { once: true }
      );

      window.addEventListener(
        "cybercrowd:email-sent",
        () => {
          sendWaiting.hidden =
            true;

          sendWaiting.style.display =
            "none";
        },
        { once: true }
      );

      entryForm.append(
        instructions,
        emailInvite,
        sendButton
      );

      plaque.appendChild(
        entryForm
      );
    },
    { once: true }
  );

  return true;
}
