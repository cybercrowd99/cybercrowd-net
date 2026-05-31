export default {
  id: "auth-a-endpoint",
  route: "/a",
  version: 1,

  async handle(request, env, ctx) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code") || null;

    // Surface pulse for debugging / visibility
    if (env?.SURFACE?.pulse) {
      env.SURFACE.pulse(`auth-a-hit:${code || "no-code"}`);
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        route: "/a",
        code,
        message: "verification entrypoint reached"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
