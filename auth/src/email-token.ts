// auth/src/email-token.ts
export interface EmailTokenPayload {
  userId: string;
  oldEmail: string;
  newEmail: string;
  type: 'email_change' | 'deadman_switch';
  iat: number;
  exp: number;
}

export class EmailTokenService {
  private static readonly ALGO = { name: 'HMAC', hash: 'SHA-256' };

  private static async getKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    return crypto.subtle.importKey('raw', encoder.encode(secret), this.ALGO, false, ['sign', 'verify']);
  }

  private static base64urlEncode(input: string | Uint8Array | ArrayBuffer): string {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private static base64urlDecode(str: string): Uint8Array {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  static async generateToken(payloadData: any, env: any, expiryMinutes = 15): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiryMinutes * 60;

    const payload = { ...payloadData, iat, exp };
    const payloadStr = JSON.stringify(payload);

    const key = await this.getKey(env.EMAIL_TOKEN_SECRET);
    const sig = await crypto.subtle.sign(this.ALGO, key, new TextEncoder().encode(payloadStr));

    return this.base64urlEncode(payloadStr) + '.' + this.base64urlEncode(sig);
  }

  static async verifyToken(token: string, env: any) {
    try {
      const [payloadB64, sigB64] = token.split('.');
      if (!payloadB64 || !sigB64) return null;

      const payloadBytes = this.base64urlDecode(payloadB64);
      const sigBytes = this.base64urlDecode(sigB64);

      const key = await this.getKey(env.EMAIL_TOKEN_SECRET);
      const valid = await crypto.subtle.verify(this.ALGO, key, sigBytes, payloadBytes);

      if (!valid) return null;

      const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
      if (payload.exp < Math.floor(Date.now() / 1000)) return null;

      return payload;
    } catch (e) {
      return null;
    }
  }

  static async commitAdd(token: string, userId: string, env: any, ttl = 900) {
    await env.VERIFY_KV.put(token, userId, { expirationTtl: ttl });
  }

  static async commitExtended(token: string, userId: string, env: any, days = 30) {
    await env.VERIFY_KV.put(token, userId, { expirationTtl: days * 86400 });
  }

  static async consume(token: string, env: any) {
    await env.VERIFY_KV.delete(token);
  }
}
