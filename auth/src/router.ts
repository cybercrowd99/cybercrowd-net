export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/verify") {
      return env.VERIFY_HANDLER.handleVerify(request, env);
    }

    if (url.pathname === "/verify-get") {
      return env.VERIFY_HANDLER.handleVerifyGet(request, env);
    }

    return new Response("Not Found", { status: 404 });
  }
};
