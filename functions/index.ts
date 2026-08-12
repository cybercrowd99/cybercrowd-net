// functions/index.ts
// CyberCrowd — NET / CORE / CASES Runtime Boundary (Pages Functions Version)
// ONE JOB: Expose the live runtime boundary through Cloudflare Pages Functions.

export async function onRequest(context) {
  const { request } = context;

  const body = {
    system: "CyberCrowd",
    site: "NET",
    core: "CORE",
    cases: "CASES",
    status: "LIVE",
    execution: "PAGES_RUNTIME",
    requestUrl: request.url
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
