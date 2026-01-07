"use client";

import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type FindManyResult,
  type PostDTO,
  type PostMode,
  postRepository,
} from "@/lib/postRepository";
import {
  createPostsQueryKey,
  isPostsQueryKeyForAuthor,
} from "@/lib/postsQueryKey";
import { PostItem } from "./PostItem";

interface PostListProps {
  authorId: string;
  mode?: "all" | PostMode;
  view?: "trash";
  onEdit?: (post: PostDTO) => void;
}

/**
 * InfiniteDataから指定されたpostIdの投稿を削除するヘルパー関数
 * @param data - 更新対象のInfiniteData
 * @param deletedPostId - 削除する投稿のID
 * @returns 更新後のInfiniteData（変更がない場合は元のデータを返す）
 */
function removePostFromInfiniteData(
  data: InfiniteData<FindManyResult> | undefined,
  deletedPostId: string,
): InfiniteData<FindManyResult> | undefined {
  if (!data) return data;

  let changed = false;
  const pages = data.pages.map((page) => {
    const filtered = page.posts.filter((post) => post.postId !== deletedPostId);
    if (filtered.length !== page.posts.length) {
      changed = true;
      return { ...page, posts: filtered };
    }
    return page;
  });

  return changed ? { ...data, pages } : data;
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

  const isTrashView = view === "trash";

  // クエリキー:
  // - 通常一覧は mode を含める
  // - ゴミ箱(view=trash)は mode に依存しないため、mode をキーから外してキャッシュ分裂を防ぐ
  const queryKey = createPostsQueryKey(
    isTrashView ? { authorId, view: "trash" } : { authorId, mode },
  );

  // フィルタリング条件を構築
  const findManyOptions = {
    authorId,
    limit: 10,
    sortBy: "updatedAt" as const,
    sortOrder: "desc" as const,
    ...(mode !== "all" && !isTrashView && { mode }),
    ...(isTrashView && { status: "trashed" as const }),
    ...(!isTrashView && { status: "active" as const }),
  };

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<
    FindManyResult,
    Error,
    InfiniteData<FindManyResult>,
    typeof queryKey,
    string | undefined
  >({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const result = (await postRepository.findMany({
        ...findManyOptions,
        cursor: pageParam,
      })) as FindManyResult;
      return result;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor;
    },
    initialPageParam: undefined as string | undefined,
  });

  // 全ページの投稿を平坦化
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  // Skeleton用の一意ID配列を生成（レイアウトシフト防止のため固定）
  const skeletonKeys = useMemo(
    () =>
      Array.from({ length: findManyOptions.limit }, (_, i) => `skeleton-${i}`),
    [findManyOptions.limit],
  );

  // IntersectionObserver で無限スクロールを実装
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        rootMargin: "100px", // 100px手前で検知
      },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ゴミ箱への移動（ソフト削除）のMutation
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      await postRepository.softDelete(postId);
    },
    onSuccess: (_data, deletedPostId) => {
      // 同一ユーザーの投稿一覧キャッシュ（mode/view/tags問わず）から該当投稿を削除
      // クエリ無効化による全再取得は行わず、スクロール済みページ数を保持
      queryClient
        .getQueryCache()
        .findAll({
          predicate: (query) =>
            isPostsQueryKeyForAuthor(query.queryKey, authorId),
        })
        .forEach((query) => {
          queryClient.setQueryData<InfiniteData<FindManyResult>>(
            query.queryKey,
            (old) => removePostFromInfiniteData(old, deletedPostId),
          );
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
  const modeTitle = isTrashView
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
        {posts && posts.length > 0 && !isLoading && (
          <span className="text-sm text-slate-500">{posts.length}件</span>
        )}
      </div>

      {/* ローディング中はSkeletonを表示 */}
      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {skeletonKeys.map((key, index) => (
            <div
              key={key}
              className={`p-4 ${
                index < findManyOptions.limit - 1
                  ? "border-b border-slate-100"
                  : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* モードバッジと日時のSkeleton */}
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  {/* 本文のSkeleton */}
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                {/* アクションボタンのSkeleton（ゴミ箱ビューでない場合） */}
                {view !== "trash" && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* データ取得完了後、投稿がある場合は実データを表示 */}
      {!isLoading && posts && posts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {posts.map((post, index) => (
            <PostItem
              key={post.postId}
              post={post}
              isLast={index === posts.length - 1 && !isFetchingNextPage}
              view={view}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          {/* 追加フェッチ中は末尾にSkeletonを表示 */}
          {isFetchingNextPage &&
            skeletonKeys.map((key, index) => (
              <div
                key={`next-${key}`}
                className={`p-4 ${
                  index < findManyOptions.limit - 1
                    ? "border-b border-slate-100"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* モードバッジと日時のSkeleton */}
                    <div className="flex items-center gap-3 mb-2">
                      <Skeleton className="h-5 w-12 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    {/* 本文のSkeleton */}
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  {/* アクションボタンのSkeleton（ゴミ箱ビューでない場合） */}
                  {view !== "trash" && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          {/* 無限スクロール用のトリガー要素 */}
          {hasNextPage && !isFetchingNextPage && (
            <div ref={loadMoreRef} className="h-1" aria-hidden="true" />
          )}
          {/* 全件取得完了メッセージ */}
          {!hasNextPage && posts.length > 0 && (
            <div className="p-4 text-center text-sm text-slate-500">
              すべての投稿を取得しました
            </div>
          )}
        </div>
      )}

      {/* データ取得完了後、投稿がない場合の空メッセージ */}
      {!isLoading && posts && posts.length === 0 && (
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
