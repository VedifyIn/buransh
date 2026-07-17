// Interaction state control for posts
export type InteractionState = 'enabled' | 'disabled' | 'auth_only';

export interface PostMetadata {
  postId: string;
  slug: string;
  title: string;
  commentsState: InteractionState;
  interactionsState: InteractionState;
  highlightsNotes: InteractionState;
  isDeleted: boolean;
}

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

export interface PostStats {
  totalLikes: number;
  totalClaps: number;
  avgRating: number;
  ratingCount: number;
}

export interface Highlight {
  id: string;
  postId: string;
  userId?: string;
  anonId?: string;
  highlightedText?: string;
  note?: string;
  selectorPrefix?: string;
  selectorSuffix?: string;
  startOffset?: number;
  endOffset?: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// Discriminated union for actor identification
export type ActorId = { type: 'user'; userId: string } | { type: 'anon'; anonId: string };

export interface SaveHighlightInput {
  postId: string;
  highlightedText?: string;
  note?: string;
  selectorPrefix?: string;
  selectorSuffix?: string;
  startOffset?: number;
  endOffset?: number;
  color?: string;
  anonId?: string;
  userId?: string;
}

export interface DatabaseProvider {
  /**
   * Get metadata for a post including interaction state controls.
   * Used to check if operations are allowed before attempting them.
   */
  getPostMetadata(contentId: string): Promise<PostMetadata | null>;

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

  getRatings(contentId: string, sinceBuildId?: string): Promise<RatingResult>;

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

  getComments(contentId: string, sinceBuildId?: string): Promise<CommentNode[]>;

  postComment(contentId: string, data: PostCommentInput, userId?: string): Promise<CommentNode>;

  /**
   * Toggle the bookmark state for a post. Returns the new state.
   */
  toggleBookmark(
    contentId: string,
    anonId?: string,
    userId?: string,
  ): Promise<SaveResult & { isBookmarked: boolean }>;

  /**
   * Toggle the like state for a post. Returns the new state.
   */
  toggleLike(
    contentId: string,
    anonId?: string,
    userId?: string,
  ): Promise<SaveResult & { isLiked: boolean }>;

  /**
   * Mark a post as read for this actor. Idempotent — calling again
   * is a no-op (the timestamp is only set on the first call).
   */
  markAsRead(contentId: string, anonId?: string, userId?: string): Promise<SaveResult>;

  /**
   * Save a highlight (text selection + optional note) for a post.
   * If an existing highlight matches the same offsets/prefix, it
   * updates the note/color instead of creating a duplicate.
   */
  saveHighlight(input: SaveHighlightInput): Promise<SaveResult & { highlight?: Highlight }>;

  /**
   * Get all highlights for a post, scoped to this actor.
   */
  getHighlights(
    contentId: string,
    anonId?: string,
    userId?: string,
    sinceBuildId?: string,
  ): Promise<Highlight[]>;

  /**
   * Public engagement stats for a post. Backed by a security_invoker
   * view that only exposes aggregates — never individual actor rows.
   * Safe to read with no auth.
   */
  getPostStats(contentId: string): Promise<PostStats>;
}
