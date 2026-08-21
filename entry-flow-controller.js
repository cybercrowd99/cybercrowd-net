function startCyberCrowdEntryFlow() {
  const form = document.getElementById("entryForm");
  const emailInput = document.getElementById("email");
  const sendButton = document.getElementById("sendButton");
  const status = document.getElementById("status");

  const state = {
    humanToken: ""
  };

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = emailInput.value.trim();

    if (!isCyberCrowdEntryEmailValid(email)) {
      setCyberCrowdEntryStatus(status, "Please enter a valid email.");
      return;
    }

    if (!state.humanToken) {
      setCyberCrowdEntryStatus(status, "Complete the human check.");
      return;
    }

    lockCyberCrowdEntryButton(sendButton, "Sending");

    try {
      await requestCyberCrowdEntry(email, state.humanToken);
    } finally {
      unlockCyberCrowdEntryButton(sendButton);
    }
  });

  window.cyberCrowdEntryHumanPassed = function (token) {
    recordCyberCrowdHumanPass(state, token);
    armCyberCrowdEntrySend(sendButton);
    setCyberCrowdEntryStatus(status, "");
  };
}
