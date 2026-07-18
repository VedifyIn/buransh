import {
  errorResponse,
  generateRequestId,
  getCorsHeaders,
  logApiError,
  parseJsonBody,
  successResponse,
} from '@/lib/api/utils';
import { PREFERENCE_CONSTRAINTS, type ThemePreference } from '@vedify/db-adapters';
import type { APIRoute } from 'astro';

const { VALID_THEMES, FONT_SIZE_MIN, FONT_SIZE_MAX, READ_MODE_MIN, READ_MODE_MAX, META_MAX_SIZE } =
  PREFERENCE_CONSTRAINTS;

export const GET: APIRoute = async (context) => {
  const requestId = generateRequestId();

  try {
    if (!context.locals.userId) {
      return errorResponse('Authentication required', 401, 'UNAUTHORIZED', requestId);
    }

    const prefs = await context.locals.db.getPreferences(context.locals.userId);
    return successResponse(prefs, 200, requestId);
  } catch (error) {
    logApiError(context, error, requestId);
    return errorResponse('Internal server error', 500, 'INTERNAL_ERROR', requestId);
  }
};

export const POST: APIRoute = async (context) => {
  const requestId = generateRequestId();

  try {
    if (!context.locals.userId) {
      return errorResponse('Authentication required', 401, 'UNAUTHORIZED', requestId);
    }

    const parseResult = await parseJsonBody<Record<string, unknown>>(context.request);
    if (!parseResult.success) {
      return errorResponse(parseResult.error, 400, 'INVALID_JSON', requestId);
    }

    const { theme, font_size, read_mode, meta } = parseResult.data;

    const prefs: Record<string, unknown> = {};
    if (theme !== undefined) {
      if (typeof theme !== 'string' || !VALID_THEMES.includes(theme as ThemePreference)) {
        return errorResponse(
          `theme must be one of: ${VALID_THEMES.join(', ')}`,
          400,
          'INVALID_THEME',
          requestId,
        );
      }
      prefs.theme = theme;
    }
    if (font_size !== undefined) {
      if (
        typeof font_size !== 'number' ||
        font_size < FONT_SIZE_MIN ||
        font_size > FONT_SIZE_MAX ||
        !Number.isInteger(font_size)
      ) {
        return errorResponse(
          `font_size must be an integer between ${FONT_SIZE_MIN} and ${FONT_SIZE_MAX}`,
          400,
          'INVALID_FONT_SIZE',
          requestId,
        );
      }
      prefs.font_size = font_size;
    }
    if (read_mode !== undefined) {
      if (
        typeof read_mode !== 'number' ||
        read_mode < READ_MODE_MIN ||
        read_mode > READ_MODE_MAX ||
        !Number.isInteger(read_mode)
      ) {
        return errorResponse(
          `read_mode must be an integer between ${READ_MODE_MIN} and ${READ_MODE_MAX}`,
          400,
          'INVALID_READ_MODE',
          requestId,
        );
      }
      prefs.read_mode = read_mode;
    }
    if (meta !== undefined) {
      if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
        return errorResponse('meta must be a JSON object', 400, 'INVALID_META', requestId);
      }
      // Validate meta size to prevent abuse
      const metaStr = JSON.stringify(meta);
      if (metaStr.length > META_MAX_SIZE) {
        return errorResponse(
          `meta field too large (max ${META_MAX_SIZE / 1024}KB)`,
          400,
          'META_TOO_LARGE',
          requestId,
        );
      }
      prefs.meta = meta;
    }

    if (Object.keys(prefs).length === 0) {
      return errorResponse('No valid preferences provided', 400, 'EMPTY_PAYLOAD', requestId);
    }

    const result = await context.locals.db.savePreferences(context.locals.userId, prefs);

    if (!result.success) {
      return errorResponse(
        result.error || 'Failed to save preferences',
        500,
        'SAVE_FAILED',
        requestId,
      );
    }

    // Return updated preferences after save
    const updated = await context.locals.db.getPreferences(context.locals.userId);
    return successResponse(updated, 200, requestId);
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
