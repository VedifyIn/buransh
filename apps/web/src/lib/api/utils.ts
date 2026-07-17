import type { APIContext } from 'astro';

export const API_ROUTES = {
  like: '/api/likes',
  bookmark: '/api/bookmarks',
  rating: '/api/ratings',
  clap: '/api/claps',
  comment: '/api/comments',
  highlight: '/api/highlights',
  stats: '/api/stats',
} as const;

export interface ApiError {
  error: string;
  code?: string;
  requestId?: string;
}

export interface ApiSuccess<T = unknown> {
  data: T;
  requestId?: string;
}

// Input validation constraints
export const VALIDATION_LIMITS = {
  COMMENT_TEXT_MAX: 5000,
  COMMENT_TEXT_MIN: 1,
  USERNAME_MAX: 100,
  USERNAME_MIN: 1,
  NOTE_MAX: 2000,
  HIGHLIGHTED_TEXT_MAX: 1000,
  CLAP_COUNT_MIN: 1,
  CLAP_COUNT_MAX: 50,
  RATING_SCORE_MIN: 1,
  RATING_SCORE_MAX: 5,
  SLUG_MAX: 200,
} as const;

/**
 * Parse and validate JSON request body
 */
export async function parseJsonBody<T = Record<string, unknown>>(
  request: Request,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return { success: false, error: 'Content-Type must be application/json' };
    }

    const data = await request.json();
    return { success: true, data: data as T };
  } catch {
    return { success: false, error: 'Invalid JSON in request body' };
  }
}

/**
 * Validate and sanitize string input
 */
export function validateString(
  value: unknown,
  field: string,
  minLength: number,
  maxLength: number,
): { valid: true; value: string } | { valid: false; error: string } {
  if (typeof value !== 'string') {
    return { valid: false, error: `${field} must be a string` };
  }

  const trimmed = value.trim();

  if (trimmed.length < minLength) {
    return { valid: false, error: `${field} must be at least ${minLength} characters` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${field} must not exceed ${maxLength} characters` };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate numeric input within range
 */
export function validateNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
): { valid: true; value: number } | { valid: false; error: string } {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: `${field} must be a valid number` };
  }

  if (value < min || value > max) {
    return { valid: false, error: `${field} must be between ${min} and ${max}` };
  }

  return { valid: true, value };
}

/**
 * Create standardized JSON response
 */
export function jsonResponse<T>(
  data: T,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      ...headers,
    },
  });
}

/**
 * Create error response
 */
export function errorResponse(
  message: string,
  status = 400,
  code?: string,
  requestId?: string,
): Response {
  const error: ApiError = { error: message, code, requestId };
  return jsonResponse(error, status);
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, status = 200, requestId?: string): Response {
  const response: ApiSuccess<T> = { data, requestId };
  return jsonResponse(response, status);
}

/**
 * Generate unique request ID for tracing
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract and validate slug from request
 */
export function validateSlug(
  slug: unknown,
): { valid: true; value: string } | { valid: false; error: string } {
  return validateString(slug, 'slug', 1, VALIDATION_LIMITS.SLUG_MAX);
}

/**
 * Sanitize HTML to prevent XSS (basic implementation)
 * For production, consider using a library like DOMPurify
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Log API errors for monitoring
 */
export function logApiError(context: APIContext, error: unknown, requestId?: string): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error('[API Error]', {
    requestId,
    path: context.url.pathname,
    method: context.request.method,
    error: errorMessage,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Set CORS headers for API responses
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  // In production, validate origin against allowlist
  const allowedOrigins = import.meta.env.ALLOWED_ORIGINS?.split(',') || [];
  const isAllowed = !origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*');

  if (!isAllowed) {
    return {};
  }

  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}
