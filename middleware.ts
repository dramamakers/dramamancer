import { NextRequest, NextResponse } from 'next/server';

// === RATE LIMITING ===

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store for rate limiting (per IP)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations by route pattern
const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  '/api/gen/quickstart': { requests: 100, windowMs: 30_000 },
  '/api/gen/story': { requests: 100, windowMs: 30_000 },
  '/api/gen/story/translate': { requests: 500, windowMs: 30_000 },

  // Default for other API routes
  '/api/': { requests: 100, windowMs: 60_000 }, // 100 per minute
};

// Clean up old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

function getRateLimitConfig(pathname: string): { requests: number; windowMs: number } {
  // Find the most specific matching rate limit
  for (const [pattern, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }
  return RATE_LIMITS['/api/'];
}

function checkRateLimit(
  ip: string,
  pathname: string,
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupRateLimitStore();

  const config = getRateLimitConfig(pathname);
  const key = `${ip}:${pathname.split('/').slice(0, 4).join('/')}`; // Group by route prefix
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired one
    entry = { count: 1, resetAt: now + config.windowMs };
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: config.requests - 1, resetAt: entry.resetAt };
  }

  entry.count++;

  if (entry.count > config.requests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: config.requests - entry.count, resetAt: entry.resetAt };
}

// === SECURITY ===

// Generate a short request ID for tracing
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Truncate long strings for logging
function truncate(str: string, maxLen: number = 100): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}

// Fast check for malicious patterns in URL/query strings
const MALICIOUS_URL_PATTERNS = [
  /busybox/i,
  /chmod\s/i,
  /wget\s/i,
  /curl\s/i,
  /\/bin\/sh/i,
  /\/bin\/bash/i,
  /\|.*sh\b/i,
  /;\s*sh\b/i,
  /`[^`]+`/,
  /\$\([^)]+\)/,
  /\.\.\/\.\.\//,
  /pkill/i,
  /killall/i,
  /rm\s+-rf/i,
  /nc\s+-/i,
  /ncat/i,
  /netcat/i,
  /python.*-c/i,
  /perl.*-e/i,
  /base64.*-d/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
];

// Check for hex-encoded shell commands in URL
const MALICIOUS_HEX_PATTERNS = [
  '2f62696e2f7368', // /bin/sh
  '2f62696e2f62617368', // /bin/bash
  '62757379626f78', // busybox
  '6368 6d6f64', // chmod
  '77676574', // wget
  '6375726c', // curl
];

function containsMaliciousContent(text: string): { blocked: boolean; reason?: string } {
  if (!text) return { blocked: false };

  // Check regex patterns
  for (const pattern of MALICIOUS_URL_PATTERNS) {
    if (pattern.test(text)) {
      return { blocked: true, reason: `Pattern: ${pattern.source}` };
    }
  }

  // Check hex patterns
  const normalized = text.toLowerCase().replace(/[^a-f0-9]/g, '');
  for (const hex of MALICIOUS_HEX_PATTERNS) {
    if (normalized.includes(hex.replace(/\s/g, ''))) {
      return { blocked: true, reason: `Hex pattern: ${hex}` };
    }
  }

  return { blocked: false };
}

// === MIDDLEWARE ===

export async function middleware(request: NextRequest) {
  const requestId = generateRequestId();

  // Extract useful request info
  const method = request.method;
  const url = request.nextUrl.pathname;
  const query = request.nextUrl.search;
  const fullUrl = url + query;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = truncate(request.headers.get('user-agent') || 'unknown', 80);
  const referer = request.headers.get('referer') || 'direct';
  const contentType = request.headers.get('content-type') || '';
  const contentLength = request.headers.get('content-length') || '0';

  // === SECURITY CHECK: Block malicious URLs at the edge ===
  const urlCheck = containsMaliciousContent(fullUrl);
  if (urlCheck.blocked) {
    console.warn(`[${requestId}] 🚨 BLOCKED URL: ${urlCheck.reason} | IP: ${ip}`);
    console.warn(`[${requestId}] 🚨 URL: ${truncate(fullUrl, 200)}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Check referer for injection attempts
  const refererCheck = containsMaliciousContent(referer);
  if (refererCheck.blocked) {
    console.warn(`[${requestId}] 🚨 BLOCKED Referer: ${refererCheck.reason} | IP: ${ip}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Check user agent for suspicious patterns (some bots use shell commands as UA)
  const uaCheck = containsMaliciousContent(userAgent);
  if (uaCheck.blocked) {
    console.warn(`[${requestId}] 🚨 BLOCKED UA: ${uaCheck.reason} | IP: ${ip}`);
    return new NextResponse('Forbidden', { status: 403 });
  }

  // === RATE LIMITING: Only for API routes ===
  if (url.startsWith('/api/')) {
    const rateLimit = checkRateLimit(ip, url);

    if (!rateLimit.allowed) {
      console.warn(`[${requestId}] ⏱️ RATE LIMITED: ${ip} on ${url}`);
      const response = new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please slow down.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetAt / 1000)),
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          },
        },
      );
      return response;
    }

    // Log the incoming request with rate limit info
    console.log(
      `[${requestId}] ➡️  ${method} ${url}${query} | IP: ${ip} | Remaining: ${rateLimit.remaining}`,
    );
    console.log(
      `[${requestId}] 📋 Content-Type: ${contentType} | Length: ${contentLength} | Referer: ${truncate(referer, 50)}`,
    );
  } else {
    // Log non-API requests without rate limit info
    console.log(`[${requestId}] ➡️  ${method} ${url}${query} | IP: ${ip} | UA: ${userAgent}`);
  }

  // Add request ID to headers for downstream logging
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // Continue with the request
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add request ID to response headers for client-side debugging
  response.headers.set('x-request-id', requestId);

  return response;
}

// Only run middleware on API routes and main pages (skip static files)
export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match main pages but not static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|mp3|woff|woff2)).*)',
  ],
};
