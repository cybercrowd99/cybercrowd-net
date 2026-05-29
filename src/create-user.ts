import postgres from "postgres";

interface Env {
  HYPERDRIVE: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { email } = await request.json() as { email: string };
    if (!email) {
      return new Response("Missing email", { status: 400 });
    }

    const sql = postgres(env.HYPERDRIVE.connectionString, {
      max: 5,
      fetch_types: false,
      prepare: true,
    });

    try {
      await sql`
        INSERT INTO users (email)
        VALUES (${email})
        ON CONFLICT (email) DO NOTHING
      `;
    } finally {
      await sql.end();
    }

    return Response.json({ created: true });
  },
};
