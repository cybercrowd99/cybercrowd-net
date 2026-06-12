export async function ensureSession() {
    const token = localStorage.getItem("sessionToken");

    if (!token) {
        window.location.href = "https://cybercrowd99.pages.dev/login.html";
        return;
    }

    const res = await fetch("/api/auth/session-status", {
        headers: {
            "Authorization": "Bearer " + token
        }
    });

    if (!res.ok) {
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("userId");
        window.location.href = "https://cybercrowd99.pages.dev/login.html";
        return;
    }

    const data = await res.json();

    if (!data.valid) {
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("userId");
        window.location.href = "https://cybercrowd99.pages.dev/login.html";
    }
}
