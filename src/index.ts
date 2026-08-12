// src/index.ts
// CyberCrowd — NET / CORE / CASES Runtime Boundary
// ONE JOB: Expose the live runtime boundary and its current system relationship.

export default {
  async fetch(request: Request): Promise<Response> {
    const body = {
      system: "CyberCrowd",
      site: "NET",
      core: "CORE",
      cases: "CASES",
      status: "LIVE",
      execution: "RUNTIME",
      requestUrl: request.url
    };

    return new Response(JSON.stringify(body, null, 2), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};
