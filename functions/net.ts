// functions/net.ts
// CyberCrowd — NET Surface (Pages Runtime)
// ONE JOB: Expose the NET surface publicly through Cloudflare Pages Functions.

export async function onRequest(context) {
  const { request } = context;

  return new Response(
    JSON.stringify(
      {
        surface: "NET",
        status: "ACTIVE",
        execution: "PAGES_RUNTIME",
        requestUrl: request.url,
        subsystem: "CyberCrowd-NET",
        lineage: "NET-LINEAGE",
        capability: "NET-CAPABILITY",
        boundary: "NET-SURFACE"
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
