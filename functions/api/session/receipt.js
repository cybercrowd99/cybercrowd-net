export async function onRequest(context) {
  const request = context.request;

  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .filter(Boolean)
      .map((v) => {
        const [k, ...rest] = v.trim().split("=");
        return [k, decodeURIComponent(rest.join("="))];
      })
  );

  const token = cookies["cc_access"] || null;

  return new Response(JSON.stringify({ token }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
