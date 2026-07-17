import { getDbAdapter } from '@vedify/db-adapters';
import { defineMiddleware } from 'astro:middleware';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const activeProvider = import.meta.env.DATABASE_PROVIDER || 'mock';
const TWO_YEARS_IN_SECONDS = 63_072_000;

// Cache for JWT verification (avoid repeated JWKS fetches)
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwksCache && import.meta.env.SUPABASE_URL) {
    jwksCache = createRemoteJWKSet(new URL(`${import.meta.env.SUPABASE_URL}/auth/v1/jwks`));
  }
  return jwksCache;
}

async function extractUserId(token: string): Promise<string | undefined> {
  try {
    // For mock/development without Supabase, decode without verification
    if (activeProvider === 'mock' && !import.meta.env.SUPABASE_URL) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || undefined;
    }

    // Production: verify JWT signature and claims
    const jwks = getJWKS();
    if (!jwks) return undefined;

    const { payload } = await jwtVerify(token, jwks, {
      issuer: `${import.meta.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    });

    return payload.sub;
  } catch {
    // Invalid or expired token
    return undefined;
  }
}

function generateAnonId(): string {
  // Use Web Crypto API for better compatibility with edge runtimes
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `anon-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export const databaseMiddleware = defineMiddleware(async (context, next) => {
  let anonId = context.cookies.get('anon-id')?.value;
  if (!anonId) {
    anonId = generateAnonId();
    context.cookies.set('anon-id', anonId, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: TWO_YEARS_IN_SECONDS,
      secure: import.meta.env.PROD,
    });
  }

  const accessToken = context.cookies.get('sb-access-token')?.value;
  const userId = accessToken ? await extractUserId(accessToken) : undefined;

  context.locals.db = getDbAdapter(activeProvider, accessToken);
  context.locals.anonId = anonId;
  context.locals.userId = userId;

  return next();
});
