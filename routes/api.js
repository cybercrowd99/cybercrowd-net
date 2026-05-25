/**
 * CyberCrowd API Routing Module
 * Provides unified GET/POST helpers and JSON normalization.
 */

/**
 * Perform a GET request and return JSON.
 */
export async function apiGet(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("GET failed: " + res.status);
        return await res.json();
    } catch (err) {
        console.error("apiGet error:", err);
        return null;
    }
}

/**
 * Perform a POST request with JSON body.
 */
export async function apiPost(url, body = {}) {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error("POST failed: " + res.status);
        return await res.json().catch(() => ({}));
    } catch (err) {
        console.error("apiPost error:", err);
        return null;
    }
}

/**
 * Normalize JSON responses.
 */
export function normalize(data, fallback = {}) {
    if (!data || typeof data !== "object") return fallback;
    return data;
}
