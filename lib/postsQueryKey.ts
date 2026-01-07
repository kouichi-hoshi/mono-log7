import type { QueryKey } from "@tanstack/react-query";
import type { PostMode } from "@/lib/postRepository";

export const POSTS_QUERY_ROOT = "posts" as const;

export interface PostsQueryKeyParams {
  authorId: string;
  mode?: "all" | PostMode;
  view?: "trash";
}

export type PostsQueryKey = [typeof POSTS_QUERY_ROOT, PostsQueryKeyParams];

export const createPostsQueryKey = (
  params: PostsQueryKeyParams,
): PostsQueryKey => {
  return [POSTS_QUERY_ROOT, params];
};

export const isPostsQueryKeyForAuthor = (
  queryKey: QueryKey,
  authorId: string,
): queryKey is PostsQueryKey => {
  return (
    Array.isArray(queryKey) &&
    queryKey[0] === POSTS_QUERY_ROOT &&
    typeof queryKey[1] === "object" &&
    queryKey[1] !== null &&
    "authorId" in queryKey[1] &&
    queryKey[1].authorId === authorId
  );
};
