import type {
  CommentNode,
  DatabaseProvider,
  Highlight,
  PostMetadata,
  UserPreferences,
} from '../../types';
import {
  canPerformOperation,
  validateClapCount,
  validateCommentContent,
  validateHighlightContent,
  validateHighlightOffsets,
  validateRating,
} from '../../utils';
import initialComments from './seeds.json';

// ── Seed data ────────────────────────────────────────────────────────
let mockComments: CommentNode[] = (initialComments as CommentNode[]).map((c) => ({
  ...c,
  userAvatar: c.userAvatar || undefined,
}));

// ── Post metadata: tracks interaction states ─────────────────────────
const mockPosts: Map<string, PostMetadata> = new Map([
  [
    'getting-started-with-astro',
    {
      postId: 'getting-started-with-astro',
      slug: 'getting-started-with-astro',
      title: 'Getting Started with Astro',
      commentsState: 'enabled',
      interactionsState: 'enabled',
      highlightsNotes: 'enabled',
      isDeleted: false,
    },
  ],
  [
    'spicy-thai-basil-chicken',
    {
      postId: 'spicy-thai-basil-chicken',
      slug: 'spicy-thai-basil-chicken',
      title: 'Spicy Thai Basil Chicken',
      commentsState: 'enabled',
      interactionsState: 'enabled',
      highlightsNotes: 'auth_only',
      isDeleted: false,
    },
  ],
]);

// ── Interaction rows: one per (post, actor) ──────────────────────────
// Mirrors user_post_interactions: a single row holds claps, rating,
// is_liked, is_bookmarked, is_read for one actor on one post.
interface InteractionRow {
  postId: string;
  userId?: string;
  anonId?: string;
  claps: number;
  isLiked: boolean;
  isBookmarked: boolean;
  bookmarkedAt?: string;
  isRead: boolean;
  readAt?: string;
  rating?: number;
  updatedAt: string;
}

const interactions: InteractionRow[] = [
  // seed some existing data
  {
    postId: 'getting-started-with-astro',
    userId: '00000000-0000-0000-0000-000000000001',
    claps: 12,
    isLiked: true,
    isBookmarked: false,
    isRead: true,
    rating: 5,
    updatedAt: '2026-06-01T14:30:00Z',
  },
  {
    postId: 'getting-started-with-astro',
    anonId: '11111111-1111-1111-1111-111111111111',
    claps: 8,
    isLiked: false,
    isBookmarked: true,
    isRead: true,
    rating: 4,
    updatedAt: '2026-06-02T10:00:00Z',
  },
  {
    postId: 'getting-started-with-astro',
    userId: '00000000-0000-0000-0000-000000000002',
    claps: 4,
    isLiked: true,
    isBookmarked: false,
    isRead: false,
    rating: 5,
    updatedAt: '2026-06-03T08:00:00Z',
  },
  {
    postId: 'spicy-thai-basil-chicken',
    userId: '00000000-0000-0000-0000-000000000003',
    claps: 10,
    isLiked: true,
    isBookmarked: true,
    isRead: true,
    rating: 4,
    updatedAt: '2026-06-03T19:20:00Z',
  },
  {
    postId: 'spicy-thai-basil-chicken',
    anonId: '22222222-2222-2222-2222-222222222222',
    claps: 6,
    isLiked: false,
    isBookmarked: false,
    isRead: true,
    rating: 3,
    updatedAt: '2026-06-04T12:00:00Z',
  },
  {
    postId: 'spicy-thai-basil-chicken',
    userId: '00000000-0000-0000-0000-000000000004',
    claps: 2,
    isLiked: true,
    isBookmarked: false,
    isRead: false,
    rating: 5,
    updatedAt: '2026-06-05T09:00:00Z',
  },
];

// Optimized Map-based storage for O(1) lookups
const interactionsMap = new Map<string, InteractionRow>();

function getInteractionKey(postId: string, anonId?: string, userId?: string): string {
  const actorId = userId || anonId || 'unknown';
  return `${postId}:${actorId}`;
}

// Initialize map from seed data
for (const row of interactions) {
  const key = getInteractionKey(row.postId, row.anonId, row.userId);
  interactionsMap.set(key, row);
}

function findRow(postId: string, anonId?: string, userId?: string): InteractionRow | undefined {
  const key = getInteractionKey(postId, anonId, userId);
  return interactionsMap.get(key);
}

function upsertRow(postId: string, anonId?: string, userId?: string): InteractionRow {
  const existing = findRow(postId, anonId, userId);
  if (existing) return existing;

  const row: InteractionRow = {
    postId,
    userId: userId || undefined,
    anonId: anonId || undefined,
    claps: 0,
    isLiked: false,
    isBookmarked: false,
    isRead: false,
    updatedAt: new Date().toISOString(),
  };

  const key = getInteractionKey(postId, anonId, userId);
  interactionsMap.set(key, row);
  return row;
}

const mockHighlights: Highlight[] = [];

// ── User preferences: one row per user ───────────────────────────────
const mockPreferences = new Map<string, UserPreferences>();

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  font_size: 3,
  read_mode: 1,
  meta: {},
};

// ── Provider ─────────────────────────────────────────────────────────

export const MockDB: DatabaseProvider = {
  async getPostMetadata(contentId) {
    return mockPosts.get(contentId) || null;
  },

  async saveRating(contentId, score, anonId, userId) {
    const validationError = validateRating(score);
    if (validationError) {
      return { success: false, error: validationError };
    }

    const post = await this.getPostMetadata(contentId);
    const check = canPerformOperation(post, 'interaction', userId);
    if (!check.allowed) {
      return { success: false, error: check.error };
    }

    const row = upsertRow(contentId, anonId, userId);
    row.rating = score;
    row.updatedAt = new Date().toISOString();
    return { success: true };
  },

  async getRatings(contentId, _sinceBuildId) {
    const scores: number[] = [];
    interactionsMap.forEach((row) => {
      if (row.postId === contentId && row.rating != null) {
        scores.push(row.rating);
      }
    });
    if (scores.length === 0) return { average: 0, count: 0 };
    const sum = scores.reduce((a, b) => a + b, 0);
    return { average: Math.round((sum / scores.length) * 10) / 10, count: scores.length };
  },

  async submitClap(contentId, count, anonId, userId) {
    const validationError = validateClapCount(count);
    if (validationError) {
      throw new Error(validationError);
    }

    const post = await this.getPostMetadata(contentId);
    const check = canPerformOperation(post, 'interaction', userId);
    if (!check.allowed) {
      throw new Error(check.error);
    }

    const row = upsertRow(contentId, anonId, userId);
    row.claps = count; // caller sends total, not increment
    row.updatedAt = new Date().toISOString();

    let totalClaps = 0;
    interactionsMap.forEach((r) => {
      if (r.postId === contentId) {
        totalClaps += r.claps;
      }
    });
    return { totalClaps };
  },

  async getComments(contentId, _sinceBuildId) {
    return mockComments
      .filter((c) => c.contentId === contentId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async postComment(contentId, data, userId) {
    const validationError = validateCommentContent(data.commentText);
    if (validationError) {
      throw new Error(validationError);
    }

    const post = await this.getPostMetadata(contentId);
    const check = canPerformOperation(post, 'comment', userId);
    if (!check.allowed) {
      throw new Error(check.error);
    }

    // Validate parent comment exists and belongs to same post
    if (data.parentId) {
      const parentComment = mockComments.find((c) => c.id === data.parentId);
      if (!parentComment) {
        throw new Error('Parent comment not found');
      }
      if (parentComment.contentId !== contentId) {
        throw new Error('Parent comment belongs to a different post');
      }
    }

    const newComment: CommentNode = {
      id: crypto.randomUUID(),
      contentId,
      parentId: data.parentId ?? null,
      userName: data.userName,
      userAvatar: data.userAvatar,
      commentText: data.commentText,
      createdAt: new Date().toISOString(),
    };
    mockComments.push(newComment);
    return newComment;
  },

  async toggleBookmark(contentId, anonId, userId) {
    const post = await this.getPostMetadata(contentId);
    const check = canPerformOperation(post, 'interaction', userId);
    if (!check.allowed) {
      return { success: false, isBookmarked: false, error: check.error };
    }

    const row = upsertRow(contentId, anonId, userId);
    row.isBookmarked = !row.isBookmarked;
    row.bookmarkedAt = row.isBookmarked ? new Date().toISOString() : undefined;
    row.updatedAt = new Date().toISOString();
    return { success: true, isBookmarked: row.isBookmarked };
  },

  async toggleLike(contentId, anonId, userId) {
    const post = await this.getPostMetadata(contentId);
    const check = canPerformOperation(post, 'interaction', userId);
    if (!check.allowed) {
      return { success: false, isLiked: false, error: check.error };
    }

    const row = upsertRow(contentId, anonId, userId);
    row.isLiked = !row.isLiked;
    row.updatedAt = new Date().toISOString();
    return { success: true, isLiked: row.isLiked };
  },

  async markAsRead(contentId, anonId, userId) {
    const post = await this.getPostMetadata(contentId);
    const check = canPerformOperation(post, 'interaction', userId);
    if (!check.allowed) {
      return { success: false, error: check.error };
    }

    const row = upsertRow(contentId, anonId, userId);
    if (!row.isRead) {
      row.isRead = true;
      row.readAt = new Date().toISOString();
      row.updatedAt = new Date().toISOString();
    }
    return { success: true };
  },

  async saveHighlight(input) {
    const offsetError = validateHighlightOffsets(input.startOffset, input.endOffset);
    if (offsetError) {
      return { success: false, error: offsetError };
    }

    const contentError = validateHighlightContent(input.highlightedText, input.note);
    if (contentError) {
      return { success: false, error: contentError };
    }

    const post = await this.getPostMetadata(input.postId);
    const check = canPerformOperation(post, 'highlight', input.userId);
    if (!check.allowed) {
      return { success: false, error: check.error };
    }

    // Find existing highlight: MUST match actor AND offsets
    const existing = mockHighlights.find(
      (h) =>
        h.postId === input.postId &&
        // Actor must match
        ((input.userId && h.userId === input.userId) ||
          (input.anonId && h.anonId === input.anonId)) &&
        // Offsets must match
        h.startOffset === input.startOffset &&
        h.endOffset === input.endOffset,
    );

    if (existing) {
      if (input.note !== undefined) existing.note = input.note;
      if (input.color) existing.color = input.color;
      existing.updatedAt = new Date().toISOString();
      return { success: true, highlight: existing };
    }

    const now = new Date().toISOString();
    const highlight: Highlight = {
      id: crypto.randomUUID(),
      postId: input.postId,
      userId: input.userId,
      anonId: input.anonId,
      highlightedText: input.highlightedText,
      note: input.note,
      selectorPrefix: input.selectorPrefix,
      selectorSuffix: input.selectorSuffix,
      startOffset: input.startOffset,
      endOffset: input.endOffset,
      color: input.color || 'yellow',
      createdAt: now,
      updatedAt: now,
    };
    mockHighlights.push(highlight);
    return { success: true, highlight };
  },

  async getHighlights(contentId, anonId, userId, _sinceBuildId) {
    return mockHighlights.filter(
      (h) =>
        h.postId === contentId &&
        ((userId && h.userId === userId) || (anonId && h.anonId === anonId)),
    );
  },

  async getPostStats(contentId) {
    let totalLikes = 0;
    let totalClaps = 0;
    let ratingSum = 0;
    let ratingCount = 0;

    interactionsMap.forEach((row) => {
      if (row.postId === contentId) {
        if (row.isLiked) totalLikes++;
        totalClaps += row.claps;
        if (row.rating != null) {
          ratingSum += row.rating;
          ratingCount++;
        }
      }
    });

    const avgRating = ratingCount === 0 ? 0 : Math.round((ratingSum / ratingCount) * 100) / 100;
    return { totalLikes, totalClaps, avgRating, ratingCount };
  },

  async getPreferences(userId) {
    return mockPreferences.get(userId) ?? { ...DEFAULT_PREFERENCES };
  },

  async savePreferences(userId, prefs) {
    const existing = mockPreferences.get(userId) ?? { ...DEFAULT_PREFERENCES };
    const merged = { ...existing, ...prefs };
    mockPreferences.set(userId, merged);
    return { success: true };
  },
};
