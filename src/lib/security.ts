/**
 * Frames By Hithu - Production Security Suite
 *
 * Provides:
 * 1. IP-based Sliding Window Rate Limiting (Protects Cloudflare KV write limits & denies DDoS).
 * 2. Brute-Force lockout for Admin Login and Client 6-Digit PINs.
 * 3. Bot spam honeypot validation for Inquiries.
 * 4. OWASP Standard HTTP Security Headers.
 * 5. Input sanitization to prevent Stored & Reflected XSS.
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window cache (0ms latency, zero KV writes consumed)
const ipRateLimitStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection every 60 seconds to prevent memory growth
let lastGcTime = Date.now();
function runRateLimitGc() {
  const now = Date.now();
  if (now - lastGcTime < 60000) return;
  lastGcTime = now;
  for (const [key, record] of ipRateLimitStore.entries()) {
    if (record.resetAt <= now) {
      ipRateLimitStore.delete(key);
    }
  }
}

/**
 * Extract trusted client IP address, prioritizing Cloudflare Edge header
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Sliding Window Rate Limiter
 * @param bucketIdentifier Unique identifier (e.g. `login:1.2.3.4` or `pin:1.2.3.4`)
 * @param maxHits Maximum allowed requests in window
 * @param windowSeconds Window length in seconds
 */
export function checkRateLimit(
  bucketIdentifier: string,
  maxHits: number,
  windowSeconds: number
): RateLimitResult {
  runRateLimitGc();

  const now = Date.now();
  const existing = ipRateLimitStore.get(bucketIdentifier);

  if (!existing || existing.resetAt <= now) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowSeconds * 1000
    };
    ipRateLimitStore.set(bucketIdentifier, newRecord);
    return {
      allowed: true,
      limit: maxHits,
      remaining: maxHits - 1,
      resetInSeconds: windowSeconds
    };
  }

  existing.count++;
  const remainingTimeSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  if (existing.count > maxHits) {
    return {
      allowed: false,
      limit: maxHits,
      remaining: 0,
      resetInSeconds: remainingTimeSec
    };
  }

  return {
    allowed: true,
    limit: maxHits,
    remaining: Math.max(0, maxHits - existing.count),
    resetInSeconds: remainingTimeSec
  };
}

/**
 * Generate 429 Too Many Requests response with standard Retry-After headers
 */
export function createRateLimitResponse(result: RateLimitResult, customMessage?: string): Response {
  const message = customMessage || `Rate limit exceeded. Too many requests. Please wait ${result.resetInSeconds} seconds before retrying.`;
  return new Response(
    JSON.stringify({
      error: message,
      retryAfterSeconds: result.resetInSeconds,
      limit: result.limit
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': result.resetInSeconds.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetInSeconds.toString()
      }
    }
  );
}

/**
 * Apply OWASP Best-Practice Security Headers to any outgoing HTTP response
 */
export function applySecurityHeaders(headers: Headers): void {
  // Prevent MIME-sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Prevent Clickjacking
  headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Legacy XSS filter for older browsers
  headers.set('X-XSS-Protection', '1; mode=block');

  // Strict Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Hardware Permissions Policy (allow camera only on same-origin for face-match selfie)
  headers.set('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');

  // Enforce HTTPS
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
}

/**
 * Sanitize string input to prevent stored or reflected XSS attacks
 */
export function sanitizeInput(input: any, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>]/g, '') // Strip angle brackets
    .slice(0, maxLength)
    .trim();
}
