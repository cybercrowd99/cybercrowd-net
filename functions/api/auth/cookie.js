export const EAT_COOKIE_NAME = "EAT";

export function makeCookie(name, value, options = {}) {
  const parts = [];

  parts.push(`${name}=${value}`);

  parts.push(`Path=${options.path || "/"}`);

  if (options.httpOnly !== false) {
    parts.push("HttpOnly");
  }

  if (options.secure !== false) {
    parts.push("Secure");
  }

  parts.push(`SameSite=${options.sameSite || "Lax"}`);

  if (options.maxAge) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  return parts.join("; ");
}

export function makeEatCookie(eat, ttlSeconds = 86400 * 7) {
  return makeCookie(EAT_COOKIE_NAME, eat, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: ttlSeconds
  });
}

export function clearEatCookie() {
  return makeCookie(EAT_COOKIE_NAME, "", {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 0
  });
}

export function readCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";

  const cookies = cookieHeader.split(";").map((part) => part.trim());

  for (const cookie of cookies) {
    const equalIndex = cookie.indexOf("=");

    if (equalIndex === -1) continue;

    const key = cookie.slice(0, equalIndex);
    const value = cookie.slice(equalIndex + 1);

    if (key === name) {
      return value;
    }
  }

  return "";
}

export function readEatCookie(request) {
  return readCookie(request, EAT_COOKIE_NAME);
}
