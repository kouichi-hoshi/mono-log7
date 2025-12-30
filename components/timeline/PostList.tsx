"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SpinnerWithFade } from "@/components/ui/spinner-with-fade";
import { postRepository } from "@/lib/postRepository";
import { PostItem } from "./PostItem";

interface PostListProps {
  authorId: string;
}

/**
 * PostList
 * 投稿一覧を表示するコンポーネント
 * TanStack Queryでデータ取得・キャッシュ管理を行う
 */
export function PostList({ authorId }: PostListProps) {
  const queryClient = useQueryClient();

  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["posts", { authorId, mode: "all" }],
    queryFn: async () => {
      return await postRepository.findMany({
        authorId,
        limit: 10,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
    },
  });

  const handleRetry = () => {
    queryClient.invalidateQueries({
      queryKey: ["posts", { authorId, mode: "all" }],
    });
  };

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-sm text-red-600 mb-4">
            投稿を読み込めませんでした
          </p>
          <Button onClick={handleRetry} variant="outline" size="sm">
            再試行
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <SpinnerWithFade isLoading={isLoading} />
      </div>

      {posts && posts.length > 0 && (
        <div className="space-y-0">
          {posts.map((post) => (
            <PostItem key={post.postId} post={post} />
          ))}
        </div>
      )}

      {posts && posts.length === 0 && !isLoading && (
        <div className="text-center py-8 text-slate-500 text-sm">
          投稿がありません
        </div>
      )}
    </div>
  );
}
