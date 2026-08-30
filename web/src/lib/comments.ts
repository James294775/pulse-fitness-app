export interface FlatComment {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: Date;
  user: { id: string; displayName: string };
}

export interface CommentNode extends FlatComment {
  replies: CommentNode[];
}

/** One level of nesting — replies-to-replies collapse onto the original top-level comment. Simple, matches most "threaded comments" UIs in practice. */
export function buildCommentTree(comments: FlatComment[]): CommentNode[] {
  const topLevel: CommentNode[] = [];
  const byId = new Map<string, CommentNode>();

  for (const c of comments) {
    byId.set(c.id, { ...c, replies: [] });
  }

  for (const c of comments) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      // Find the top-level ancestor so a reply-to-a-reply still nests one level deep.
      let ancestor = byId.get(c.parentId)!;
      while (ancestor.parentId && byId.has(ancestor.parentId)) {
        ancestor = byId.get(ancestor.parentId)!;
      }
      ancestor.replies.push(node);
    } else {
      topLevel.push(node);
    }
  }

  return topLevel;
}
