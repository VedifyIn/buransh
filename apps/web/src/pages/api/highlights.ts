import {
  errorResponse,
  generateRequestId,
  getCorsHeaders,
  logApiError,
  parseJsonBody,
  sanitizeHtml,
  successResponse,
  validateSlug,
  validateString,
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
    const highlights = await context.locals.db.getHighlights(
      slugValidation.value,
      context.locals.anonId,
      context.locals.userId,
      sinceBuildId,
    );

    return successResponse({ highlights, buildId: sinceBuildId }, 200, requestId);
  } catch (error) {
    logApiError(context, error, requestId);
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR', requestId);
  }
};

export const POST: APIRoute = async (context) => {
  const requestId = generateRequestId();

  try {
    const parseResult = await parseJsonBody<{
      slug: string;
      highlightedText: string;
      note?: string;
      selectorPrefix?: string;
      selectorSuffix?: string;
      startOffset?: number;
      endOffset?: number;
      color?: string;
    }>(context.request);

    if (!parseResult.success) {
      return errorResponse(parseResult.error, 400, 'INVALID_JSON', requestId);
    }

    const body = parseResult.data;

    // Validate slug
    const slugValidation = validateSlug(body.slug);
    if (!slugValidation.valid) {
      return errorResponse(slugValidation.error, 400, 'INVALID_SLUG', requestId);
    }

    // Validate highlightedText
    const textValidation = validateString(
      body.highlightedText,
      'highlightedText',
      1,
      VALIDATION_LIMITS.HIGHLIGHTED_TEXT_MAX,
    );
    if (!textValidation.valid) {
      return errorResponse(textValidation.error, 400, 'INVALID_HIGHLIGHT_TEXT', requestId);
    }

    // Validate optional note
    let sanitizedNote: string | undefined;
    if (body.note) {
      const noteValidation = validateString(body.note, 'note', 0, VALIDATION_LIMITS.NOTE_MAX);
      if (!noteValidation.valid) {
        return errorResponse(noteValidation.error, 400, 'INVALID_NOTE', requestId);
      }
      sanitizedNote = sanitizeHtml(noteValidation.value);
    }

    const result = await context.locals.db.saveHighlight({
      postId: slugValidation.value,
      highlightedText: sanitizeHtml(textValidation.value),
      note: sanitizedNote,
      selectorPrefix: body.selectorPrefix,
      selectorSuffix: body.selectorSuffix,
      startOffset: body.startOffset,
      endOffset: body.endOffset,
      color: body.color,
      anonId: context.locals.anonId,
      userId: context.locals.userId,
    });

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
