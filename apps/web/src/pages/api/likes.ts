import {
  errorResponse,
  generateRequestId,
  getCorsHeaders,
  logApiError,
  parseJsonBody,
  successResponse,
  validateSlug,
} from '@/lib/api/utils';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
  const requestId = generateRequestId();

  try {
    const parseResult = await parseJsonBody<{ slug: string }>(context.request);
    if (!parseResult.success) {
      return errorResponse(parseResult.error, 400, 'INVALID_JSON', requestId);
    }

    const { slug } = parseResult.data;
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return errorResponse(slugValidation.error, 400, 'INVALID_SLUG', requestId);
    }

    const result = await context.locals.db.toggleLike(
      slugValidation.value,
      context.locals.anonId,
      context.locals.userId,
    );

    return successResponse(result, result.success ? 200 : 403, requestId);
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
