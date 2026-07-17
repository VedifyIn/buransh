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
    const comments = await context.locals.db.getComments(slugValidation.value, sinceBuildId);

    return successResponse({ comments, buildId: sinceBuildId }, 200, requestId);
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
      userName: string;
      commentText: string;
      parentId?: string;
      userAvatar?: string;
    }>(context.request);

    if (!parseResult.success) {
      return errorResponse(parseResult.error, 400, 'INVALID_JSON', requestId);
    }

    const { slug, userName, commentText, parentId, userAvatar } = parseResult.data;

    // Validate slug
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return errorResponse(slugValidation.error, 400, 'INVALID_SLUG', requestId);
    }

    // Validate userName
    const userNameValidation = validateString(
      userName,
      'userName',
      VALIDATION_LIMITS.USERNAME_MIN,
      VALIDATION_LIMITS.USERNAME_MAX,
    );
    if (!userNameValidation.valid) {
      return errorResponse(userNameValidation.error, 400, 'INVALID_USERNAME', requestId);
    }

    // Validate commentText
    const commentTextValidation = validateString(
      commentText,
      'commentText',
      VALIDATION_LIMITS.COMMENT_TEXT_MIN,
      VALIDATION_LIMITS.COMMENT_TEXT_MAX,
    );
    if (!commentTextValidation.valid) {
      return errorResponse(commentTextValidation.error, 400, 'INVALID_COMMENT', requestId);
    }

    // Sanitize inputs to prevent XSS
    const sanitizedUserName = sanitizeHtml(userNameValidation.value);
    const sanitizedCommentText = sanitizeHtml(commentTextValidation.value);

    const comment = await context.locals.db.postComment(
      slugValidation.value,
      {
        userName: sanitizedUserName,
        commentText: sanitizedCommentText,
        parentId,
        userAvatar,
      },
      context.locals.userId,
    );

    return successResponse(comment, 201, requestId);
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
