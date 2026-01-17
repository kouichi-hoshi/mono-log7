import type { PostStatus } from "@/lib/postRepository";

type Carrier = {
  status: PostStatus;
  deletedAt: Date | null;
  postId?: string;
};

function handleInconsistency(message: string): void {
  if (process.env.NODE_ENV === "production") {
    console.error(message);
    return;
  }
  throw new Error(message);
}

/**
 * Guard to ensure status/deletedAt stay consistent.
 * - active  -> deletedAt must be null
 * - trashed -> deletedAt must be non-null
 */
export function assertPostStatusDeletedAtConsistency(post: Carrier): void {
  const isActiveWithDeletedAt =
    post.status === "active" && post.deletedAt !== null;
  const isTrashedWithoutDeletedAt =
    post.status === "trashed" && post.deletedAt === null;

  if (isActiveWithDeletedAt || isTrashedWithoutDeletedAt) {
    const idLabel = post.postId ? ` postId=${post.postId}` : "";
    const message = `Post status/deletedAt inconsistent${idLabel}: status=${post.status}, deletedAt=${post.deletedAt}`;
    handleInconsistency(message);
  }
}
