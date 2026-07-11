export interface CommentNode {
  id: string;
  contentId: string;
  parentId: string | null;
  userName: string;
  userAvatar?: string;
  commentText: string;
  createdAt: string;
}

export interface PostCommentInput {
  userName: string;
  commentText: string;
  parentId?: string | null;
  userAvatar?: string;
}

export interface RatingResult {
  average: number;
  count: number;
}

export interface SaveResult {
  success: boolean;
  error?: string;
}

export interface ClapResult {
  totalClaps: number;
}

export interface DatabaseProvider {
  /**
   * Save a 1-5 rating for a piece of content on behalf of a logged-in
   * user (userId) or an anonymous visitor (anonId — a client-generated
   * UUID, persisted in a cookie/localStorage, NOT an IP address).
   */
  saveRating(
    contentId: string,
    score: number,
    anonId?: string,
    userId?: string,
  ): Promise<SaveResult>;

  getRatings(contentId: string): Promise<RatingResult>;

  /**
   * Set this actor's clap count for a piece of content (Medium-style —
   * the caller sends the actor's current total, not an increment).
   */
  submitClap(
    contentId: string,
    count: number,
    anonId?: string,
    userId?: string,
  ): Promise<ClapResult>;

  getComments(contentId: string): Promise<CommentNode[]>;

  postComment(contentId: string, data: PostCommentInput, userId?: string): Promise<CommentNode>;
}
