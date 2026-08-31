// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// LANE:
// PUBLIC NET
//
// FILE:
// create-account-sequence-four-instructions-node.js
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #4
//
// JOB:
// Mount the approved Email + SEND instructions
// directly onto the existing Sequence #4 plaque.
//
// FUNCTION:
// installSequenceFourInstructionsNode()
//
// INPUT:
// cybercrowd:face-three-arrived
//
// OUTPUT:
// .email-send-instructions
//
// PARENT:
// .glass-plaque-four
//
// DOES NOT OWN:
// Instructions presentation.
// Email node creation.
// Email presentation.
// Email opening.
// Email readiness.
// SEND node creation.
// SEND presentation.
// SEND readiness.
// SEND click.
// Turnstile.
// Verification.
// Movement.
// Rotation.
// Audio.
// WHOOSH.
// Transmission.
// Authentication.
// Session.
// Routing.
// Backend authority.
// Old-limb removal.

.glass-plaque-four
> .email-send-instructions {
  position: absolute;

  top: 19%;
  left: 50%;

  transform:
    translate(-50%, -50%)
    translateZ(4px);

  width:
    min(88%, 460px);

  margin: 0;
  padding: 0;

  color:
    #2a2118;

  font:
    inherit;

  font-size:
    clamp(
      0.82rem,
      2.2vw,
      1rem
    );

  font-weight:
    600;

  line-height:
    1.45;

  letter-spacing:
    0.02em;

  text-align:
    center;

  z-index: 7;

  pointer-events:
    none;
}
