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
// -> one human touch
// -> cybercrowd:send-requested
// -> SEND decal disappears
// -> automatic non-touch waiting state appears
// -> cybercrowd:email-sent
// -> waiting state clears
// -> existing WHOOSH fires automatically.
//
// NO SECOND TOUCH.
//
// ONE-FILE ASSET RULE:
// Both approved decals are embedded in this file.
// No side image files.
// No placeholder asset strings.
// No new graphics.

export function installEmailSendSurface() {
  const APPROVED_ENTER_EMAIL_DECAL =
    "data:image/webp;base64,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";

  const APPROVED_SEND_DECAL =
    "data:image/webp;base64,UklGRuQKAABXRUJQVlA4INgKAABQNwCdASpAAWsAPt1krFCopSkqpRi7yVAbiUdpZui35GABF0ptzqs34jpU/tP+r8b1+30zbhvnwdOFgZn9IzVv0Ru8qRX5NT8v/RKlBvIkX+RIv8iRfvpzSy4oCX/gQf0QU6MgXc+saI95ME4SF3McdGr5JaNnSn9Erkp97s31poTFc8snDkxg/RvGsBXza9wpTDhVUCJ1ROslksmOBSiJcSAPEKdjeWTly+h0GfPIOBgXR6mxH1XAog+ZgiqRXkA5kdDHgLGl3wQCeax/fQ7wFNrMk/r7zWLPmWYJl6HTfcfJQuTluQUMyssCG1kQxUd+8uXtyMbfldXngfQyr7QKZBPvnnA0x0LCBUp9iRV45++nNkoY20XfFq8V5En+OG+QeCSqh3bobUT7IKBQWoUmocbOi24QWv2jEAqOxjp4Qzq0zWtQFhWHmE2MlzDR3Hhx1N+UF/yMf0YTT33U+2JtvJ5l57PdEBpFZIx2cNpBxpFQGbcLAoSRuOYkAK64lHYQbyB9NQyb3bNoifrN5ujoj9Pufh/p5HnZSxZ5hfNDkZ+lp0hHVvu3KjebverlAeYkhsEG2b5tRi2eT2bw+oBiTxEAAP75ASAAAAAAbdRum6efXeeJgWCIYHmmqQw641Yl3ZZaEgYj6Vxezi9szTdEYib30PlhPXBL63aDngqmm698OOSi/6/Ip20ENKun/IpPCyXNlSGzk8RG1nrgDw3Q9dXAYMc2K/cxz84RjIOYyJaqzhRgV+orHhMC7TInxvdZDGJ3n4zunMMmVT4A3cpIDIvhi/Z1MTvCs4Hhd2JNPHjzWS9TrR9se/FoCL2Vm3ZxPZLXhcoNmM1HH6mCrjGOpvadj/K17H9qtvzoCtcrJAy6r1ICy7hPRO407DhwUQTLt9/ZmIVl4Dx4D/7qA/MCafbzKtiQ1d3kZZ0nSwwzlsnIUmi7ySPYU4Er1JT4zGYSyK3HHdzlrj5J6xoNB6wQSUuKOVX5XJUwcdqhH0RTe8aHFww2oLZ6LJHoViYTKyC7YMc+V/2ih/uvf+t8S50U6bUYzxzFX2EV73vcZ/QEcuemRdoEXAmYH1ZgQxdA8WA49vfS+cD8jNqs4UHp51U5RFYy57H/SDmROD7WdUrZYiKf8fyu1a4g3noIN7J+5YxGXsNxAEzLPK15TpUNjdXJN7x+d7P2P8mcGvdE6T81pap/tc8XIF0mIdtOZAWB9YK8XSHlvc57NfcOKbRmgmZOPgdHZ3kidfWayTNiwO4OS2VNj55th+xobdceLqfckM2jHvasrFNZgBSgRdf+jq2xma6FwHpInmwAOt3jYY60h2dPjn8//5AAOrpIBzZAh2wHJBfj4m8VNIjEF+s+/Ewg/k4BaYVu412JLDAUFt0TedR2LdEjPjL6CGKe5IQILyYIRgX+lHhw3zyvZDtNKOeDkwJqLoDhYeu21x5PxVszIwzxkaqKMKnVIyBEq/mDrok1S3yiolIxRuecWdo73XOQWptlkftknjAOGGteR1pvBNEnl7rWwSJZZ0/wYWSn5OVnQKOMGb2MR5+Mob2GTt/fDVE8tE5SOuh7/1NjRPw6IrAxGRWwk/18IZKOx45Gbfp8j1CKtFWTLFkFgPPGopy6pHeoW/aWVao5bnyL0p2xfH2y4kP8oFzJWJ0DiBpXL1HkzUodVPPaOPsVUj02dKUDcDp8t5NWpfpUdhHP9uaV3zOuz1GlAK1E8zMAb3Z9Wj9SwK4DXEih6Y31UxTyGz+WLeif1pR5IwtH1qUCTdz47fo2a78ipy6p5t83InONrZlIGfCUELB94IDV1lxf99BZb32FyG28qL19Rs+ZbZcOITKekFKAwxC7+UUo4W3VZFI3z5XCAafXPquHDdN8D6znYXrSHSgKS4vBhqItsM55RVeiHNH9yOIwZNT9rlGns30g+pkHKob8nIeask31U7hZ7MpvE1VMMkr3zIiB0SRKCpdZpwXTGw3s3HzvGzTH4R44548Icyp6D+QVW7CXAKXVdqltGau3Qnvq4WJrNNoKcg71GIT8s6g+ZN+zLChH5oi5hVs0pHEPRHPfMF4kXUPai5Psk0uS8Al4+rj5PDe0vS/svR+rVRudfcfv/hKpFwOpEuPWVISzrb1a94W7Ars2TKtyuPGb/NXpUY9X8JXbRxKjkhxGgkt2KNF5j6r1EUTqhl2sEzHZqW+9RgN4S3EZ0GxUarFc2EadNlFi12V08eMfS6vQjNxE6X8rJ0jv9br7kU46oAqBFA1eFCJVOQZqAATQzGaAEsY3AHk0gQxtZ/zcvV1kRwc5nrzYVcLLPwTMDIeePsX1wGGHxZclpYA+cn4TTZf9VOpEiFq09K+R2fW6kYF2AY3KjgexyBiJB3SM47RrCR+4ieqoi9qT18FBLMH6K1IAxWXZY8PomQ6SjlSuE1UYBGtK8nVy5rbBdQ+XftnSyf1Cyz0qTrEX1j/htiHDiRcTuxfpoPaaAflUc1lRZR4VkNKJ3i9KPI00rOvXmDY4RCVsvb08FczAYkemmoK++WjaW2gxUASqjycoGstGR+/lJdu6Q7CC4USxVeet8Vk8814iHkqzPrN3W0a7l8hM9fSHbVKivj1A2NA6c7/vcvjOxcPcpiyUhGuzCOoM8266fQdVHUHKfvZE920/jlDEKVLCH5hng47HeEsP6ZP8W314x9Weyk6C/nJ1UzQF37LPVSBVi3aPNoOqaFML3YOWbAT0tOfybspj1MgLJ/c/nEq9EV+aZ+vTftkbbX52gxscF9MXSc6MyLQpYQCXcjiqz9UTMdo+BphpJmXzNRx2WnidHe/mhVuubhfk/kq+PhoISbEiuC+sTlUpSFGV/U/il1y5+dS0s4U1s/ssgcMUJeUb2vgD0usCo9UJg0CV4VlFZ9t7m3R6EXvV15AB5XLTfBt0fbIBUQL/mFFElSBY4RWslSA32LAPcqgcXO4saphDkzvEHFwXdvldDtj1MRD2ds/Atu3Ai4o0Gq8AH8Qq7IstvYiw2Plr8ILhHyUbS54TlMU5BZ2ZPQK4HkJ2uIp7vGX8mX7vQ8oErSDeec6Kamd2NX9+KeibxHbveiyh+jGwCzKmzR8G58dLkRKPZCZVAVyabR1vjzbxHAACaGlZZVzuQQHpmFxRV0pa++rFWINjMBhbBRHmWHxIqfcL3E9trofBrBxKl4b/2YHI8oU38M1yIzEmp2GBWwdfz/Rmts0yoFhdr1AjBMHivxMZDFrAzmtKCmvptjV7d4K2lPlWYxbRLj/86FbYy4gazUrV+yxZis/GTQFSYxqJic7f96uafHd6KBbmutCIko7hSI+sJ1qzLCjS7zcXrQ+RsIf+vJYy5KiYfy74qlCoUrFxlvxgCCaBED/emmSJ8XcRmz1MYA8fFvgdWIbaCkDIAEkC+1jW9Y+ph6Czo69kp6TtkVYQk0BJ3+mCdqFrFtK3nh5165BJwCzadwya9Tkwb7hf0nUZPqQfdoHp6iWlvDdaoKPgS3jrrBNZnmuSiLmNypDqZ8fkQfxMUCpkXB3llbaaMsPngOYZCulMsVYFzg56P5l6mVZDRIKOaVtQ29C4fqb0Wiz+RakVoYZhhEV7XUKD4ygxzmZ+9BbBxHTWGDBnW5rXnp7u96oyYxqIojZ7QfBBcqPXefbRBmcdY2z1c7A8OZG51aucbXYU40BmCsu4bvqnIdy5coxgN0EA8NOAAAAAAAAAAAAA";

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
        "100% 100%";

      emailInvite.style.backgroundPosition =
        "center";

      emailInvite.style.backgroundRepeat =
        "no-repeat";

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
        "100% 100%";

      sendButton.style.backgroundPosition =
        "center";

      sendButton.style.backgroundRepeat =
        "no-repeat";

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
       *
       * Appears automatically after
       * cybercrowd:send-requested.
       *
       * Waits for cybercrowd:email-sent.
       *
       * Existing WHOOSH listener owns
       * automatic WHOOSH.
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
       * Existing send-action file emits:
       * cybercrowd:send-requested
       *
       * This file owns only the visual
       * transition into waiting state.
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

      /*
       * AUTO TURN.
       *
       * Existing success emitter sends:
       * cybercrowd:email-sent
       *
       * Waiting state clears.
       * Existing WHOOSH listener fires.
       *
       * NO SECOND TOUCH.
       */
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
