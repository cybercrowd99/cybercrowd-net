export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const token = url.searchParams.get("token");
    if (!token) {
      return new Response("Missing token", { status: 400 });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; padding: 40px;">
        <h2>Email Verification</h2>
        <form method="POST" action="/verify">
          <input type="hidden" name="token" value="${token}">
          <button type="submit" style="padding: 10px 20px; font-size: 16px;">
            Verify Email
          </button>
        </form>
      </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store"
      }
    });
  }
};
