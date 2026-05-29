import { createVerificationToken, consumeVerificationToken } from "./verify";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/verify" && request.method === "POST") {
      const { email } = await request.json();
      if (!email) {
        return new Response("Invalid email", { status: 400 });
      }

      const token = await createVerificationToken(env, email);
      return new Response(JSON.stringify({ token }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (url.pathname === "/verify-get" && request.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) {
        return new Response("Missing token", { status: 400 });
      }

      const result = await consumeVerificationToken(env, token);
      if (!result.ok) {
        return new Response("Invalid or expired token", { status: 400 });
      }

      return new Response("Email verified", { status: 200 });
    }

    return new Response("Not Found", { status: 404 });
  }
};
