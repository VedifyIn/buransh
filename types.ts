export interface RatingData {
  average: number;
  count: number;
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

export interface DatabaseProvider {
  saveRating(
    contentId: string,
    score: number,
    userIp: string,
    userId?: string,
  ): Promise<{ success: boolean }>;
  getRatings(contentId: string): Promise<RatingData>;
  submitClap(
    contentId: string,
    count: number,
    userIp: string,
    userId?: string,
  ): Promise<{ totalClaps: number }>;
  getComments(contentId: string): Promise<CommentNode[]>;
  postComment(
    contentId: string,
    data: Omit<CommentNode, 'id' | 'createdAt'>,
    userId?: string,
  ): Promise<CommentNode>;
}
