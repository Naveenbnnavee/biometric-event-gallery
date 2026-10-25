// Admin session authentication using Web Crypto HMAC with Cloudflare Pages edge runtime support

const COOKIE_NAME = 'fh_admin_session';
const DEFAULT_PASS = 'FramesHithu@2026';
const DEFAULT_SECRET = 'frames-by-hithu-luxury-secret-key-2026';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// Request-scoped Cloudflare runtime environment storage
let runtimeAuthEnv: any = null;

export function setRuntimeAuthEnv(env: any): void {
  runtimeAuthEnv = env;
}

export function getRuntimeAuthEnv(): any {
  return runtimeAuthEnv;
}

export function getAdminPassword(env?: any): string {
  const target = env || runtimeAuthEnv;
  // 1. Cloudflare Workers / Pages runtime secret
  if (target && target.ADMIN_PASSWORD) {
    return target.ADMIN_PASSWORD;
  }
  // 2. Node.js environment variable
  if (typeof process !== 'undefined' && process.env?.ADMIN_PASSWORD) {
    return process.env.ADMIN_PASSWORD;
  }
  // 3. Vite / Astro environment variable
  if (typeof import.meta !== 'undefined' && (import.meta.env as any)?.ADMIN_PASSWORD) {
    return (import.meta.env as any).ADMIN_PASSWORD;
  }
  return DEFAULT_PASS;
}

export function getSessionSecret(env?: any): string {
  const target = env || runtimeAuthEnv;
  // 1. Cloudflare Workers / Pages runtime secret
  if (target && (target.SESSION_SECRET || target.ADMIN_SESSION_SECRET)) {
    return target.SESSION_SECRET || target.ADMIN_SESSION_SECRET;
  }
  // 2. Node.js environment variable
  const nodeSecret = (typeof process !== 'undefined') ? (process.env?.SESSION_SECRET || process.env?.ADMIN_SESSION_SECRET) : undefined;
  if (nodeSecret) {
    return nodeSecret;
  }
  // 3. Vite / Astro environment variable
  if (typeof import.meta !== 'undefined' && ((import.meta.env as any)?.SESSION_SECRET || (import.meta.env as any)?.ADMIN_SESSION_SECRET)) {
    return (import.meta.env as any).SESSION_SECRET || (import.meta.env as any).ADMIN_SESSION_SECRET;
  }
  return DEFAULT_SECRET;
}

export function validatePassword(inputPassword: string, env?: any): boolean {
  const currentPassword = getAdminPassword(env);
  return inputPassword.trim() === currentPassword.trim();
}

async function getCryptoKey(env?: any): Promise<CryptoKey> {
  const secret = getSessionSecret(env);
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSessionToken(env?: any): Promise<string> {
  const payload = {
    role: 'admin',
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000
  };
  const json = JSON.stringify(payload);
  const base64Payload = btoa(json);

  const key = await getCryptoKey(env);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(base64Payload)
  );
  const signatureHex = bufferToHex(signatureBuffer);

  return `${base64Payload}.${signatureHex}`;
}

export async function verifySessionToken(token: string, env?: any): Promise<boolean> {
  try {
    const [base64Payload, signatureHex] = token.split('.');
    if (!base64Payload || !signatureHex) return false;

    const key = await getCryptoKey(env);
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(base64Payload)
    );
    const expectedHex = bufferToHex(signatureBuffer);

    if (signatureHex !== expectedHex) return false;

    const payload = JSON.parse(atob(base64Payload));
    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return false;
    }

    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  const cookies: Record<string, string> = {};
  header.split(';').forEach(c => {
    const [k, v] = c.trim().split('=');
    if (k && v) {
      cookies[k] = decodeURIComponent(v);
    }
  });
  return cookies;
}

export async function isAuthenticated(request: Request, env?: any): Promise<boolean> {
  const cookieHeader = request.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  return await verifySessionToken(token, env);
}

export function isSecureContext(request?: Request): boolean {
  if (request) {
    try {
      const url = new URL(request.url);
      if (url.protocol === 'https:') return true;
      const forwardedProto = request.headers.get('x-forwarded-proto');
      if (forwardedProto === 'https') return true;
      const cfVisitor = request.headers.get('cf-visitor');
      if (cfVisitor && cfVisitor.includes('https')) return true;
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return false;
    } catch {}
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.PROD) {
    return true;
  }
  return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
}

export async function getSessionCookieHeader(request?: Request, env?: any): Promise<string> {
  const token = await createSessionToken(env);
  const secure = isSecureContext(request) ? '; Secure' : '';
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE}${secure}`;
}

export function getClearSessionCookieHeader(request?: Request): string {
  const secure = isSecureContext(request) ? '; Secure' : '';
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secure}`;
}
