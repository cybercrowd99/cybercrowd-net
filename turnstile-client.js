/*
CYBERCROWD

FILE:
create-account-glass-plaque-two.css

BUILD LAW:
1 FILE
1 JOB
1 FUNCTION

JOB:
Present the Sequence #2 clear glass face.

FUNCTION:
Style .glass-plaque-two only.
*/

.glass-plaque-two {
  position: relative;

  grid-area: 1 / 1;

  display: block;

  width: min(88vw, 520px);
  height: min(72vh, 620px);

  border:
    2px solid
    rgba(214, 242, 232, 0.78);

  border-radius: 24px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.42),
      rgba(255, 255, 255, 0.10)
    ),
    rgba(238, 248, 242, 0.28);

  backdrop-filter:
    blur(7px)
    saturate(1.08);

  -webkit-backdrop-filter:
    blur(7px)
    saturate(1.08);

  box-shadow:
    0 26px 70px rgba(0, 0, 0, 0.34),
    inset 0 0 0 1px
      rgba(255, 255, 255, 0.52),
    inset 0 0 30px
      rgba(255, 255, 255, 0.18);

  transform-origin:
    50%
    50%
    calc(-1 * var(--cylinder-depth));

  transform-style: preserve-3d;

  backface-visibility: visible;
  -webkit-backface-visibility: visible;

  transform:
    translateY(-2px)
    rotateX(2deg)
    rotateY(
      calc(
        var(--cylinder-angle) -
        1.5707963267948966rad
      )
    );

  transition:
    transform
    90ms
    linear;

  will-change: transform;

  pointer-events: none;
}

.glass-plaque-two.is-active {
  pointer-events: auto;
}

.glass-plaque-two #turnstile-one {
  position: absolute;

  top: 61%;
  left: 50%;

  width: 210px;
  height: 48px;

  display: block;

  overflow: hidden;

  z-index: 2;

  transform: translate(-50%, -50%);
}

.glass-plaque-two #turnstile-one iframe {
  transform: scale(0.70);
  transform-origin: top left;
}
