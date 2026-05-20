export async function onRequest(context) {
  const request = context.request;

  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map(v => {
      const [k, ...rest] = v.trim().split("=");
      return [k, rest.join("=")];
    })
  );

  const token = cookies["cc_access"] || null;

  return new Response(JSON.stringify({ token }), {
    headers: { "Content-Type": "application/json" }
  });
}
