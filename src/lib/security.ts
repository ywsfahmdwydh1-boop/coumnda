import crypto from 'node:crypto';

const KEY_LENGTH = 64;
const DEFAULT_SALT_ROUNDS = 16;
const DEFAULT_EXPIRY_HOURS = 24 * 7; // 7 days

/**
 * Generate a cryptographically secure random salt hex string.
 */
export function generateSalt(length = DEFAULT_SALT_ROUNDS): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password using scrypt (memory-hard, resistant to brute-force).
 */
export function hashPassword(password: string, salt: string): string {
  if (!password || !salt) {
    throw new Error('Password and salt are required for hashing');
  }
  const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
  return derivedKey.toString('hex');
}

/**
 * Verify a password against stored salt and hash in constant time.
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  if (!password || !hash || !salt) return false;
  try {
    const derivedKey = crypto.scryptSync(password, salt, KEY_LENGTH);
    const storedBuffer = Buffer.from(hash, 'hex');
    if (derivedKey.length !== storedBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, storedBuffer);
  } catch {
    return false;
  }
}

export interface TokenPayload {
  userId: string;
  role: 'admin' | 'user';
  email: string;
  exp: number; // timestamp ms
}

/**
 * Create a cryptographically signed HMAC-SHA256 session token.
 */
export function createToken(
  payload: Omit<TokenPayload, 'exp'>,
  secret: string,
  expiresInHours = DEFAULT_EXPIRY_HOURS
): string {
  const exp = Date.now() + expiresInHours * 60 * 60 * 1000;
  const fullPayload: TokenPayload = { ...payload, exp };
  const data = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verify HMAC token and return decoded payload if valid and not expired.
 */
export function verifyToken(token: string, secret: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  try {
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    if (signature.length !== expectedSig.length) return null;
    
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const jsonStr = Buffer.from(data, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr) as TokenPayload;

    if (!parsed || !parsed.userId || !parsed.role || !parsed.exp) {
      return null;
    }

    if (Date.now() > parsed.exp) {
      return null; // Expired
    }

    return parsed;
  } catch {
    return null;
  }
}
