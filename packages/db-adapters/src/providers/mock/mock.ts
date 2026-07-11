import type { DatabaseProvider, CommentNode } from '../../types';
import initialComments from './seeds.json';

let mockComments: CommentNode[] = [...(initialComments as CommentNode[])];
let mockRatings: Record<string, number[]> = { 'using-mdx': [5, 4] };
let mockClaps: Record<string, number> = { 'using-mdx': 12 };

export const MockDB: DatabaseProvider = {
  async saveRating(contentId, score) {
    // NOTE: unlike SupabaseDB, this doesn't dedupe by actor — every
    // call pushes a new score, so calling it twice as "the same user"
    // will count twice. Fine for local UI testing, just not 1:1 with
    // production upsert semantics.
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
    // NOTE: same caveat as saveRating — this accumulates indefinitely
    // rather than replacing one actor's total, so repeated calls will
    // keep adding rather than converging like the real upsert does.
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
};
