export async function logout() {
    await fetch("/api/auth/logout-master", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + (localStorage.getItem("sessionToken") || "")
        }
    });

    localStorage.removeItem("sessionToken");
    localStorage.removeItem("userId");

    window.location.href = "/login.html";
}
