/**
 * functions/ping-shared/ping-session.js
 *
 * CyberCrowd PING Session Helper
 *
 * ONE JOB:
 * Read a verified CyberCrowd identity from the current request session.
 */

import { cleanText } from "./ping-basic.js";
import { readJsonKey } from "./ping-kv.js";

export async function readVerifiedIdentity(request, env) {
  if (!env || !env.IDENTITY) {
    return "";
  }

  const token =
    getCookie(request, "session") ||
    getCookie(request, "cc_session") ||
    getCookie(request, "EAT") ||
    getBearerToken(request);

  if (!token) {
    return "";
  }

  const session = await readJsonKey(env, "session:" + token);

  if (!session) {
    return "";
  }

  return cleanText(
    session.identity_id ||
      session.identityId ||
      session.identity_active_id ||
      session["identity-active-id"] ||
      session.idl ||
      session.email ||
      ""
  );
}

function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  const parts = header.split(";");

  for (const part of parts) {
    const index = part.indexOf("=");

    if (index === -1) continue;

    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return "";
}

function getBearerToken(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return "";
  }

  return match[1].trim();
}
