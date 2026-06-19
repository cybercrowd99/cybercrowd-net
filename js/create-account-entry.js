// CyberCrowd Create Account – Wiring Only
// No Turnstile. No token. No KV. No session. No cookie. No authority.

// Elements
const emailInput = document.getElementById("email");
const sendButton = document.getElementById("send-btn");
const statusBox = document.getElementById("status");
const overlay = document.getElementById("check-email-overlay");

// Reset UI
function resetUI() {
  statusBox.textContent = "";
  overlay.style.display = "none";
  sendButton.disabled = false;
}

// Minimal POST wiring
async function sendEmailRequest() {
  resetUI();

  const email = emailInput.value.trim();
  if (!email) {
    statusBox.textContent = "Please enter your email.";
    return;
  }

  sendButton.disabled = true;
  statusBox.textContent = "Sending…";

  try {
    const res = await fetch("/api/auth/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (data.success) {
      // Show overlay only — no authority here
      overlay.style.display = "flex";
      statusBox.textContent = "";
    } else {
      statusBox.textContent = data.error || "Unable to send verification.";
      sendButton.disabled = false;
    }
  } catch (err) {
    statusBox.textContent = "Network error. Try again.";
    sendButton.disabled = false;
  }
}

// Bind
sendButton.addEventListener("click", sendEmailRequest);
