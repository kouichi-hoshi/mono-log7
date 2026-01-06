"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SpinnerWithFade } from "@/components/ui/spinner-with-fade";
import {
  type PostDTO,
  type PostMode,
  postRepository,
} from "@/lib/postRepository";
import { PostItem } from "./PostItem";

interface PostListProps {
  authorId: string;
  mode?: "all" | PostMode;
  view?: "trash";
  onEdit?: (post: PostDTO) => void;
}

/**
 * PostList
 * 投稿一覧を表示するコンポーネント
 * TanStack Queryでデータ取得・キャッシュ管理を行う
 */
export function PostList({
  authorId,
  mode = "all",
  view,
  onEdit,
}: PostListProps) {
  const queryClient = useQueryClient();

  // クエリキーに mode と view を含める
  const queryKey = [
    "posts",
    {
      authorId,
      mode,
      view,
    },
  ] as const;

  // フィルタリング条件を構築
  const findManyOptions = {
    authorId,
    limit: 10,
    sortBy: "updatedAt" as const,
    sortOrder: "desc" as const,
    ...(mode !== "all" && { mode }),
    ...(view === "trash" && { status: "trashed" as const }),
    ...(view !== "trash" && { status: "active" as const }),
  };

  const {
    data: posts,
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      return await postRepository.findMany(findManyOptions);
    },
  });

  // ゴミ箱への移動（ソフト削除）のMutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      await postRepository.softDelete(postId);
    },
    onSuccess: () => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({
        queryKey,
      });
      toast.success("ごみ箱に移動しました");
    },
    onError: (error) => {
      console.error("削除エラー:", error);
      toast.error("削除に失敗しました");
    },
  });

  const handleRetry = () => {
    queryClient.invalidateQueries({
      queryKey,
    });
  };

  const handleEdit = (post: PostDTO) => {
    onEdit?.(post);
  };

  const handleDelete = (postId: string) => {
    deleteMutation.mutate(postId);
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

  // モードタイトルを決定
  const modeTitle =
    view === "trash"
      ? "ごみ箱"
      : mode === "memo"
        ? "メモ"
        : mode === "todo"
          ? "ToDo"
          : mode === "diary"
            ? "日記"
            : "すべて";

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
              view={view}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {posts && posts.length === 0 && !isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500 text-sm">
            {view === "trash" ? "ごみ箱は空です" : "投稿がありません"}
          </p>
          {view !== "trash" && (
            <p className="text-slate-400 text-xs mt-1">
              左のエディタから新しい投稿を作成してください
            </p>
          )}
        </div>
      )}
    </div>
  );
}
