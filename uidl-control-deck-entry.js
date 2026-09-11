// CYBERCROWD
//
// FILE:
// uidl-control-deck-entry.js
//
// REPO:
// cybercrowd99/cybercrowd-net
//
// BUILD LAW:
// 1 FILE
// 1 JOB
// 1 FUNCTION
//
// SEQUENCE:
// #11
//
// JOB:
// Receive the completed
// returning-member uIDL handoff
// and open the existing
// uIDL Control Deck.
//
// FUNCTION:
// installUidlControlDeckEntry()
//
// ENTRANCE:
// cybercrowd:uidl-control-deck-required
//
// EXIT:
// /uidl-control-deck.html
//
// DOES NOT OWN:
// Members Only.
// Turnstile #3.
// Turnstile verification.
// Email.
// Email matching.
// Password input.
// Password verification.
// Identity creation.
// uIDL creation.
// Session creation.
// Cookie creation.
// Control Deck HTML.
// Control Deck CSS.
// Presence cartridges.
// Private creation.
// Professional creation.
// Hobby creation.
// Lane creation.
// Turnstile #4.

function installUidlControlDeckEntry() {
  window.addEventListener(
    "cybercrowd:uidl-control-deck-required",
    function openUidlControlDeck() {
      window.location.href =
        "/uidl-control-deck.html";
    }
  );
}

installUidlControlDeckEntry();
