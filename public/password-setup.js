const params = new URLSearchParams(window.location.search);
const email = params.get("email");
const setupToken = params.get("token");

// Update the email label if present
if (email) {
  const label = document.getElementById("emailLabel");
  if (label) label.innerText = email;
}

async function postJSON(url, data) {
  return await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include"
  });
}

document.getElementById("init").onclick = async () => {
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;
  const msg = document.getElementById("msg");

  if (password !== confirm) {
    msg.innerText = "Passwords do not match.";
    return;
  }

  const turnstileToken = turnstile.getResponse();

  const res = await postJSON("/api/set-password", {
    email,
    password,
    setupToken,
    turnstileToken
  });

  const out = await res.json();
  msg.innerText = out.error || "Password set. Redirecting…";

  if (out.ok) {
    setTimeout(() => {
      window.location.href = "/vault.html";
    }, 1200);
  }
};
