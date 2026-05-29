export interface Env {
  VERIFY_KV: KVNamespace;
  HYPERDRIVE: any;
  POSTMARK_TOKEN: string;
}

export interface VerificationToken {
  email: string;
  token: string;
  createdAt: number;
}

export interface EmailPayload {
  From: string;
  To: string;
  Subject: string;
  TextBody: string;
}

export interface VerifyRequestBody {
  email: string;
}
