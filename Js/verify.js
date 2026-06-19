// CyberCrowd Verify Room – Browser Wiring Only
// Owns: token-from-URL, verify route request, spinner/status, redirect.
// Owns NOT: token creation, KV writes, password logic, session, cookie, EAT, Turnstile, email sending.

(async function () {
  const statusBox = document.getElementById("verify-status");
  const spinner = document.getElementById("verify-spinner");

  function setStatus(message, color = "#00ffff") {
    if (statusBox) {
      statusBox.textContent = message;
      statusBox.style.color = color;
    }
  }

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    setStatus("Missing verification token.", "#ff5555");
    return;
  }

  setStatus("Verifying your entry…");
  spinner?.classList.add("active");

  let data;

  try {
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    data = await res.json();
  } catch (_) {
    spinner?.classList.remove("active");
    setStatus("Network error. Try again.", "#ff5555");
    return;
  }

  spinner?.classList.remove("active");

  if (!data || data.success !== true) {
    setStatus("Verification link expired or invalid.", "#ff5555");
    return;
  }

  setStatus("Verified. Redirecting…");

  setTimeout(() => {
    window.location.href = `/setup.html?token=${encodeURIComponent(token)}`;
  }, 600);
})();
