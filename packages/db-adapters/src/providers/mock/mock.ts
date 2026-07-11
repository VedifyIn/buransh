import type { DatabaseProvider, CommentNode, Highlight } from '../../types';
import initialComments from './seeds.json';

let mockComments: CommentNode[] = [...(initialComments as CommentNode[])];
let mockRatings: Record<string, number[]> = { 'using-mdx': [5, 4] };
let mockClaps: Record<string, number> = { 'using-mdx': 12 };

// actor_key = `${postId}:${userId || anonId}`
const mockBookmarks: Record<string, boolean> = {};
const mockLikes: Record<string, boolean> = {};
const mockReads: Record<string, boolean> = {};
const mockHighlights: Highlight[] = [];

function actorKey(postId: string, anonId?: string, userId?: string): string {
  return `${postId}:${userId || anonId || 'unknown'}`;
}

export const MockDB: DatabaseProvider = {
  async saveRating(contentId, score) {
    if (!mockRatings[contentId]) mockRatings[contentId] = [];
    mockRatings[contentId].push(score);
    return { success: true };
  },

  async getRatings(contentId) {
    const scores = mockRatings[contentId] || [];
    if (scores.length === 0) return { average: 0, count: 0 };
    const sum = scores.reduce((a, b) => a + b, 0);
    return { average: Math.round((sum / scores.length) * 10) / 10, count: scores.length };
  },

  async submitClap(contentId, count) {
    if (!mockClaps[contentId]) mockClaps[contentId] = 0;
    mockClaps[contentId] += count;
    return { totalClaps: mockClaps[contentId] };
  },

  async getComments(contentId) {
    return mockComments
      .filter((c) => c.contentId === contentId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async postComment(contentId, data) {
    const newComment: CommentNode = {
      ...data,
      id: crypto.randomUUID(),
      contentId,
      createdAt: new Date().toISOString(),
    };
    mockComments.push(newComment);
    return newComment;
  },

  async toggleBookmark(contentId, anonId, userId) {
    const key = actorKey(contentId, anonId, userId);
    mockBookmarks[key] = !mockBookmarks[key];
    return { success: true, isBookmarked: mockBookmarks[key] };
  },

  async toggleLike(contentId, anonId, userId) {
    const key = actorKey(contentId, anonId, userId);
    mockLikes[key] = !mockLikes[key];
    return { success: true, isLiked: mockLikes[key] };
  },

  async markAsRead(contentId, anonId, userId) {
    const key = actorKey(contentId, anonId, userId);
    mockReads[key] = true;
    return { success: true };
  },

  async saveHighlight(input) {
    // find existing by matching offsets or prefix+suffix
    const existing = mockHighlights.find(
      (h) =>
        h.postId === input.postId &&
        ((input.userId && h.userId === input.userId) ||
          (input.anonId && h.anonId === input.anonId)) &&
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

  async getHighlights(contentId, anonId, userId) {
    return mockHighlights.filter(
      (h) =>
        h.postId === contentId &&
        ((userId && h.userId === userId) || (anonId && h.anonId === anonId)),
    );
  },
};
