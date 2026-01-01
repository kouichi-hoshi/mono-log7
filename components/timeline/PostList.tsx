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
      <div className="py-8 px-4 md:px-0">
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

  // モードタイトル（現在は"all"固定なので"すべて"を表示）
  const modeTitle = "すべて";

  return (
    <div>
      {/* モードタイトル */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <h2 className="text-xl font-bold text-slate-900">{modeTitle}</h2>
        {posts && posts.length > 0 && (
          <span className="text-sm text-slate-500">{posts.length}件</span>
        )}
      </div>

      <div className="mb-4 px-4 md:px-0">
        <SpinnerWithFade isLoading={isLoading} />
      </div>

      {posts && posts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {posts.map((post, index) => (
            <PostItem
              key={post.postId}
              post={post}
              isLast={index === posts.length - 1}
            />
          ))}
        </div>
      )}

      {posts && posts.length === 0 && !isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500 text-sm">投稿がありません</p>
          <p className="text-slate-400 text-xs mt-1">
            左のエディタから新しい投稿を作成してください
          </p>
        </div>
      )}
    </div>
  );
}
