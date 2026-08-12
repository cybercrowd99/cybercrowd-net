// functions/cases.ts
// CyberCrowd — CASES Surface (Pages Runtime)
// ONE JOB: Expose the CASES surface publicly through Cloudflare Pages Functions.

export async function onRequest(context) {
  const { request } = context;

  return new Response(
    JSON.stringify(
      {
        surface: "CASES",
        status: "ACTIVE",
        execution: "PAGES_RUNTIME",
        requestUrl: request.url,
        subsystem: "CyberCrowd-CASES",
        boundary: "CASES-SURFACE"
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
