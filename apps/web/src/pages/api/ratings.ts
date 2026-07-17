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

export const GET: APIRoute = async (context) => {
  const requestId = generateRequestId();

  try {
    const slug = context.url.searchParams.get('slug');
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return errorResponse(slugValidation.error, 400, 'INVALID_SLUG', requestId);
    }

    const sinceBuildId = context.url.searchParams.get('sinceBuildId') ?? undefined;
    const result = await context.locals.db.getRatings(slugValidation.value, sinceBuildId);

    return successResponse(result, 200, requestId);
  } catch (error) {
    logApiError(context, error, requestId);
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR', requestId);
  }
};

export const POST: APIRoute = async (context) => {
  const requestId = generateRequestId();

  try {
    const parseResult = await parseJsonBody<{ slug: string; score: number }>(context.request);
    if (!parseResult.success) {
      return errorResponse(parseResult.error, 400, 'INVALID_JSON', requestId);
    }

    const { slug, score } = parseResult.data;

    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return errorResponse(slugValidation.error, 400, 'INVALID_SLUG', requestId);
    }

    const scoreValidation = validateNumber(
      score,
      'score',
      VALIDATION_LIMITS.RATING_SCORE_MIN,
      VALIDATION_LIMITS.RATING_SCORE_MAX,
    );
    if (!scoreValidation.valid) {
      return errorResponse(scoreValidation.error, 400, 'INVALID_SCORE', requestId);
    }

    const result = await context.locals.db.saveRating(
      slugValidation.value,
      scoreValidation.value,
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
