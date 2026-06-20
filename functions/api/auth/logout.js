import { readEatCookie, clearEatCookie } from "./cookie.js";
import { sessionKey } from "./user-store.js";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  try {
    const eat = readEatCookie(request);

    if (eat && env.IDENTITY) {
      await env.IDENTITY.delete(sessionKey(eat));
    }

    return json(
      {
        success: true,
        status: "logged_out",
        redirect: "/login.html"
      },
      200,
      {
        "Set-Cookie": clearEatCookie()
      }
    );
  } catch (error) {
    return json(
      {
        success: false,
        error: "logout_failed"
      },
      500,
      {
        "Set-Cookie": clearEatCookie()
      }
    );
  }
}
