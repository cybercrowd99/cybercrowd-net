import { onRequestPost as signupPost } from "./api/auth/signup.js";
import { onRequestGet as verifyGet } from "./api/auth/verify.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/api/enrollment/start" && request.method === "POST") {
      return signupPost({
        request,
        env,
        ctx
      });
    }

    if (path === "/api/auth/signup" && request.method === "POST") {
      return signupPost({
        request,
        env,
        ctx
      });
    }

    if (path === "/api/enrollment/verify" && request.method === "GET") {
      return verifyGet({
        request,
        env,
        ctx
      });
    }

    if (path === "/api/auth/verify" && request.method === "GET") {
      return verifyGet({
        request,
        env,
        ctx
      });
    }

    if (path === "/api/enrollment/status") {
      return Response.json({
        success: true,
        route_status: "active",
        message: "/api/enrollment/start is routed through worker.js to /api/auth/signup.js",
        send_route: "/api/enrollment/start",
        verify_route: "/api/enrollment/verify",
        assets_fallback: true
      });
    }

    return env.ASSETS.fetch(request);
  }
};
