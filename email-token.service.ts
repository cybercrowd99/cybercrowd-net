// email-token.service.ts
export interface EmailTokenPayload {
  userId: string;
  oldEmail: string;
  newEmail: string;
  type: 'email_change' | 'verify' | 'deadman_switch';
  iat: number; // issued at (Unix seconds)
  exp: number; // expiry (Unix seconds)
}

export class EmailTokenService {
  private static readonly ALGO = { name: 'HMAC', hash: 'SHA-256' };

  private static async getKey(secret: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    return crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      this.ALGO,
      false,
      ['sign', 'verify']
    );
  }

  private static base64urlEncode(input: string | Uint8Array | ArrayBuffer): string {
    const bytes = typeof input === 'string'
      ? new TextEncoder().encode(input)
      : input instanceof ArrayBuffer
      ? new Uint8Array(input)
      : input;

    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static base64urlDecode(str: string): Uint8Array {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /** Generate: base64url(JSON) . base64url(HMAC(JSON)) */
  static async generateToken(
    payloadData: Omit<EmailTokenPayload, 'iat' | 'exp'>,
    env: { EMAIL_TOKEN_SECRET: string },
    expiryMinutes: number = 15
  ): Promise<string> {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiryMinutes * 60;

    const payload: EmailTokenPayload = { ...payloadData, iat, exp };
    const payloadStr = JSON.stringify(payload);

    const key = await this.getKey(env.EMAIL_TOKEN_SECRET);

    // Sign the raw JSON string bytes
    const signatureBuffer = await crypto.subtle.sign(
      this.ALGO,
      key,
      new TextEncoder().encode(payloadStr)
    );

    const payloadBase64 = this.base64urlEncode(payloadStr);
    const signatureBase64 = this.base64urlEncode(signatureBuffer);

    return `${payloadBase64}.${signatureBase64}`;
  }

  /** Verify token */
  static async verifyToken(
    token: string,
    env: { EMAIL_TOKEN_SECRET: string }
  ): Promise<EmailTokenPayload | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;

      const [payloadBase64, signatureBase64] = parts;

      const payloadBytes = this.base64urlDecode(payloadBase64);
      const signatureBytes = this.base64urlDecode(signatureBase64);

      const key = await this.getKey(env.EMAIL_TOKEN_SECRET);

      const isValid = await crypto.subtle.verify(
        this.ALGO,
        key,
        signatureBytes,
        payloadBytes   // verify against the original JSON bytes
      );

      if (!isValid) return null;

      const payloadJson = new TextDecoder().decode(payloadBytes);
      const payload = JSON.parse(payloadJson) as EmailTokenPayload;

      // Expiry check
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) return null;

      return payload;
    } catch (e) {
      console.error('Token verification failed:', e);
      return null;
    }
  }
}
