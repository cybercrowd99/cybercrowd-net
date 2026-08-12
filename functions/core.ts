// functions/core.ts
// CyberCrowd — CORE Surface (Pages Runtime)
// ONE JOB: Expose the CORE surface publicly through Cloudflare Pages Functions.

export async function onRequest(context) {
  const { request } = context;

  return new Response(
    JSON.stringify(
      {
        surface: "CORE",
        status: "ACTIVE",
        execution: "PAGES_RUNTIME",
        requestUrl: request.url,
        subsystem: "CyberCrowd-CORE",
        boundary: "CORE-SURFACE"
      },
      null,
      2
    ),
    {
      status: 200,
      headers: { "content-type": "application/json" }
    }
  );
}
