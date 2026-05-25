/**
 * CyberCrowd Standalone Auth Login Script
 * Handles email submission, token storage, and redirect.
 */

const emailInput = document.getElementById("auth-email");
const loginBtn = document.getElementById("auth-login-btn");
const statusBox = document.getElementById("auth-login-status");

const AUTH_ENDPOINT = "/api/auth/login";   // backend endpoint (replace if needed)
const DASHBOARD_TARGET = "/dashboard.html";

/**
 * Display status message
 */
function setStatus(msg, type = "") {
    statusBox.textContent = msg;
    statusBox.className = type ? type : "";
}

/**
 * Perform login
 */
async function performLogin() {
    const email = emailInput.value.trim();

    if (!email) {
        setStatus("Enter your email.", "error");
        return;
    }

    setStatus("Connecting...", "");

    try {
        const response = await fetch(AUTH_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }

        const data = await response.json();

        if (!data || !data.token) {
            throw new Error("No token returned.");
        }

        // Store token
        localStorage.setItem("cc_access", data.token);

        setStatus("Access granted.", "success");

        // Redirect
        setTimeout(() => {
            window.location.href = DASHBOARD_TARGET;
        }, 600);

    } catch (err) {
        console.error("Auth login failed:", err);
        setStatus("Login failed. Try again.", "error");
    }
}

/**
 * Wire events
 */
loginBtn.addEventListener("click", performLogin);

emailInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        performLogin();
    }
});
