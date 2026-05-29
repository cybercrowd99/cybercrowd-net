import postgres from "postgres";

interface Env {
  VERIFY_KV: KVNamespace;
  POSTMARK_TOKEN: string;
}

const TOKEN_TTL = 900
