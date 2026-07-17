import {
  errorResponse,
  generateRequestId,
  getCorsHeaders,
  logApiError,
  successResponse,
  validateSlug,
} from '@/lib/api/utils';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const requestId = generateRequestId();

  try {
    const slug = context.url.searchParams.get('slug');
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return errorResponse(slugValidation.error, 400, 'INVALID_SLUG', requestId);
    }

    const stats = await context.locals.db.getPostStats(slugValidation.value);
    return successResponse(stats, 200, requestId);
  } catch (error) {
    logApiError(context, error, requestId);
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR', requestId);
  }
};

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin') || undefined;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
};
