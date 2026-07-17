import {
  errorResponse,
  generateRequestId,
  getCorsHeaders,
  logApiError,
  parseJsonBody,
  successResponse,
  validateNumber,
  validateSlug,
  VALIDATION_LIMITS,
} from '@/lib/api/utils';
import type { APIRoute } from 'astro';

export const POST: APIRoute = async (context) => {
  const requestId = generateRequestId();
  const origin = context.request.headers.get('origin') || undefined;

  try {
    const parseResult = await parseJsonBody<{ slug: string; count: number }>(context.request);
    if (!parseResult.success) {
      return errorResponse(parseResult.error, 400, 'INVALID_JSON', requestId);
    }

    const { slug, count } = parseResult.data;

    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return errorResponse(slugValidation.error, 400, 'INVALID_SLUG', requestId);
    }

    const countValidation = validateNumber(
      count,
      'count',
      VALIDATION_LIMITS.CLAP_COUNT_MIN,
      VALIDATION_LIMITS.CLAP_COUNT_MAX,
    );
    if (!countValidation.valid) {
      return errorResponse(countValidation.error, 400, 'INVALID_COUNT', requestId);
    }

    const result = await context.locals.db.submitClap(
      slugValidation.value,
      countValidation.value,
      context.locals.anonId,
      context.locals.userId,
    );

    return successResponse(result, 200, requestId);
  } catch (error) {
    logApiError(context, error, requestId);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return errorResponse(message, 500, 'INTERNAL_ERROR', requestId);
  }
};

export const OPTIONS: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin') || undefined;
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
};
