// CYBERCROWD
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// FILE:
// member-entry-hologram.js
//
// LOCATION:
// REPOSITORY ROOT / NET
//
// JOB:
// Control one Member Entry hologram panel
// through floating, docked, and shutdown states.
//
// OWNS:
// Hologram board creation.
// Projection state.
// Docked state.
// Shutdown state.
// Hologram content slot.
//
// DOES NOT OWN:
// Turnstile verification.
// Member recall.
// Email matching.
// Password verification.
// Authentication.
// Session.
// Cookie.
// Routing.

export class MemberEntryHologram {
  constructor(socketElement) {
    this.socket = socketElement;

    this.board = document.createElement("div");
    this.board.className = "hologram-board";

    this.board.innerHTML = `
      <div
        style="
          font-size: 0.8rem;
          letter-spacing: 2px;
          text-transform: uppercase;
        "
      >
        [ 2.5D NEURAL OVERLAY ]
      </div>

      <div
        id="holo-content-slot"
        style="margin-top: 10px;"
      ></div>
    `;

    this.socket.appendChild(this.board);
  }

  project() {
    this.board.classList.remove("state-docked");
    this.board.classList.add("state-floating");
  }

  dockSolid() {
    this.board.classList.remove("state-floating");
    this.board.classList.add("state-docked");
  }

  shutdown() {
    this.board.classList.remove(
      "state-floating",
      "state-docked"
    );
  }
}
