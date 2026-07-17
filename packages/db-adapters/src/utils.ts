import { createHash } from 'node:crypto';
import type { InteractionState, PostMetadata } from './types';

/**
 * SHA-1 hash using Node.js crypto (synchronous).
 * Returns raw bytes.
 */
export function sha1(data: number[]): number[] {
  const buf = createHash('sha1').update(Uint8Array.from(data)).digest();
  return Array.from(buf);
}

/**
 * Validate that an interaction is allowed based on post state and actor type.
 * @returns error message if not allowed, null if allowed
 */
export function validateInteractionAllowed(
  state: InteractionState,
  hasUserId: boolean,
  operationType: 'comment' | 'interaction' | 'highlight',
): string | null {
  if (state === 'disabled') {
    return `${operationType}s are disabled for this post`;
  }
  if (state === 'auth_only' && !hasUserId) {
    return `${operationType}s require authentication for this post`;
  }
  return null;
}

/**
 * Check if post allows the operation based on interaction state.
 */
export function canPerformOperation(
  post: PostMetadata | null,
  operationType: 'comment' | 'interaction' | 'highlight',
  userId?: string,
): { allowed: boolean; error?: string } {
  if (!post) {
    return { allowed: false, error: 'Post not found' };
  }
  if (post.isDeleted) {
    return { allowed: false, error: 'Post has been deleted' };
  }

  const hasUserId = Boolean(userId);
  let state: InteractionState;

  switch (operationType) {
    case 'comment':
      state = post.commentsState;
      break;
    case 'interaction':
      state = post.interactionsState;
      break;
    case 'highlight':
      state = post.highlightsNotes;
      break;
  }

  const error = validateInteractionAllowed(state, hasUserId, operationType);
  return error ? { allowed: false, error } : { allowed: true };
}

/**
 * Validate highlight offset values.
 */
export function validateHighlightOffsets(startOffset?: number, endOffset?: number): string | null {
  if (startOffset === undefined && endOffset === undefined) {
    return null; // Both null is ok
  }
  if (startOffset === undefined || endOffset === undefined) {
    return 'Both startOffset and endOffset must be provided together';
  }
  if (startOffset < 0 || endOffset < 0) {
    return 'Offsets cannot be negative';
  }
  if (endOffset <= startOffset) {
    return 'endOffset must be greater than startOffset';
  }
  return null;
}

/**
 * Validate clap count.
 */
export function validateClapCount(count: number): string | null {
  if (count < 0) {
    return 'Clap count cannot be negative';
  }
  if (count > 50) {
    return 'Clap count cannot exceed 50';
  }
  if (!Number.isInteger(count)) {
    return 'Clap count must be an integer';
  }
  return null;
}

/**
 * Validate rating score.
 */
export function validateRating(score: number): string | null {
  if (!Number.isInteger(score)) {
    return 'Rating must be an integer';
  }
  if (score < 1 || score > 5) {
    return 'Rating must be between 1 and 5';
  }
  return null;
}

/**
 * Validate comment content.
 */
export function validateCommentContent(content: string): string | null {
  if (content.trim().length === 0) {
    return 'Comment cannot be empty';
  }
  if (content.length > 3000) {
    return 'Comment cannot exceed 3000 characters';
  }
  return null;
}

/**
 * Validate highlight/note content.
 */
export function validateHighlightContent(highlightedText?: string, note?: string): string | null {
  if (!highlightedText && !note) {
    return 'Highlight must contain either highlighted text or a note';
  }
  if (highlightedText && highlightedText.length > 3000) {
    return 'Highlighted text cannot exceed 3000 characters';
  }
  if (note && note.length > 3000) {
    return 'Note cannot exceed 3000 characters';
  }
  return null;
}
