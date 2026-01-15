"use client";

import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type FindManyCursor,
  type FindManyResult,
  type PostDTO,
  type PostMode,
  postRepository,
} from "@/lib/postRepository";
import {
  createPostsQueryKey,
  isPostsQueryKeyForAuthor,
  type PostsQueryKey,
} from "@/lib/postsQueryKey";
import { PostItem } from "./PostItem";
import { PostSortControls } from "./PostSortControls";

interface PostListProps {
  authorId: string;
  mode?: "all" | PostMode;
  view?: "trash";
  sortBy?: "updatedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
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

function removePostsFromInfiniteData(
  data: InfiniteData<FindManyResult> | undefined,
  deletedPostIds: string[],
): InfiniteData<FindManyResult> | undefined {
  if (!data || deletedPostIds.length === 0) return data;
  const idSet = new Set(deletedPostIds);
  let changed = false;
  const pages = data.pages.map((page) => {
    const filtered = page.posts.filter((post) => !idSet.has(post.postId));
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
  sortBy = "updatedAt",
  sortOrder = "desc",
  onEdit,
}: PostListProps) {
  const queryClient = useQueryClient();

  const isTrashView = view === "trash";

  // 選択状態管理（ゴミ箱ビューでのみ使用）
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(
    new Set(),
  );

  // 削除確認モーダルの状態管理
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postsToDelete, setPostsToDelete] = useState<string[]>([]);
  const [isEmptyTrashDialogOpen, setIsEmptyTrashDialogOpen] = useState(false);

  // クエリキー:
  // - 通常一覧は mode, sortBy, sortOrder を含める
  // - ゴミ箱(view=trash)は mode に依存しないため、mode をキーから外してキャッシュ分裂を防ぐ
  // - sortBy/sortOrderは常に含める（キャッシュを分離するため）
  const queryKey = createPostsQueryKey(
    isTrashView
      ? { authorId, view: "trash", sortBy, sortOrder }
      : { authorId, mode, sortBy, sortOrder },
  );

  const getAuthorTrashQueryKeys = () => {
    const trashKeys = queryClient
      .getQueryCache()
      .findAll({
        predicate: (query) => {
          if (!isPostsQueryKeyForAuthor(query.queryKey, authorId)) {
            return false;
          }
          const [, params] = query.queryKey as PostsQueryKey;
          return params.view === "trash";
        },
      })
      .map((query) => query.queryKey as PostsQueryKey);

    return trashKeys;
  };

  // フィルタリング条件を構築
  const findManyOptions = {
    authorId,
    limit: 10,
    sortBy: sortBy as "updatedAt" | "createdAt",
    sortOrder: sortOrder as "asc" | "desc",
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
    FindManyCursor | undefined
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
    initialPageParam: undefined as FindManyCursor | undefined,
  });

  // 全ページの投稿を平坦化
  const posts = data?.pages.flatMap((page) => page.posts) ?? [];
  // undefined/nullを除外した有効な投稿のみ
  const validPosts = posts.filter((p): p is PostDTO => p != null);

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

      // ゴミ箱ビューのキャッシュを再取得させる
      const trashQueryKeys = getAuthorTrashQueryKeys();
      trashQueryKeys.forEach((trashQueryKey) => {
        queryClient.invalidateQueries({ queryKey: trashQueryKey });
      });
    },
    onError: (error) => {
      console.error("削除エラー:", error);
      toast.error("削除に失敗しました");
    },
  });

  // 復元（ゴミ箱から戻す）のMutation
  const restoreMutation = useMutation({
    mutationFn: async (postIds: string[]) => {
      await Promise.all(postIds.map((id) => postRepository.restore(id)));
    },
    onSuccess: (_data, restoredPostIds) => {
      // ゴミ箱ビューのキャッシュから復元された投稿を削除
      const trashQueryKeys = getAuthorTrashQueryKeys();
      trashQueryKeys.forEach((trashQueryKey) => {
        queryClient.setQueryData<InfiniteData<FindManyResult>>(
          trashQueryKey,
          (old) => removePostsFromInfiniteData(old, restoredPostIds),
        );
      });
      // 通常一覧のキャッシュを無効化（復元された投稿が表示されるように）
      queryClient
        .getQueryCache()
        .findAll({
          predicate: (query) =>
            isPostsQueryKeyForAuthor(query.queryKey, authorId) &&
            !query.queryKey.includes("trash"),
        })
        .forEach((query) => {
          queryClient.invalidateQueries({ queryKey: query.queryKey });
        });

      // 選択状態をクリア
      setSelectedPostIds(new Set());

      toast.success("投稿を復元しました");
    },
    onError: (error) => {
      console.error("復元エラー:", error);
      toast.error("復元に失敗しました");
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

  // 完全削除（ハード削除）のMutation
  const hardDeleteMutation = useMutation({
    mutationFn: async (postIds: string[]) => {
      await Promise.all(postIds.map((id) => postRepository.hardDelete(id)));
    },
    onSuccess: (_data, deletedPostIds) => {
      // ゴミ箱ビューのキャッシュから削除された投稿を削除
      const trashQueryKeys = getAuthorTrashQueryKeys();
      trashQueryKeys.forEach((trashQueryKey) => {
        queryClient.setQueryData<InfiniteData<FindManyResult>>(
          trashQueryKey,
          (old) => removePostsFromInfiniteData(old, deletedPostIds),
        );
      });

      // 選択状態をクリア
      setSelectedPostIds(new Set());

      toast.success("投稿を削除しました");
    },
    onError: (error) => {
      console.error("削除エラー:", error);
      toast.error("削除に失敗しました");
    },
  });

  const handleDelete = (postId: string) => {
    if (isTrashView) {
      // ゴミ箱ビューでは確認モーダルを表示
      setPostsToDelete([postId]);
      setDeleteDialogOpen(true);
    } else {
      // 通常ビューではソフト削除
      deleteMutation.mutate(postId);
    }
  };

  const handleRestore = () => {
    if (selectedPostIds.size === 0) return;
    restoreMutation.mutate(Array.from(selectedPostIds));
  };

  // ゴミ箱を空にするMutation
  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      await postRepository.emptyTrash(authorId);
    },
    onSuccess: () => {
      // ゴミ箱ビューのキャッシュをクリア
      const trashQueryKeys = getAuthorTrashQueryKeys();
      trashQueryKeys.forEach((trashQueryKey) => {
        queryClient.setQueryData<InfiniteData<FindManyResult>>(
          trashQueryKey,
          () => ({
            pages: [{ posts: [], nextCursor: undefined }],
            pageParams: [undefined],
          }),
        );
      });

      // 選択状態をクリア
      setSelectedPostIds(new Set());

      toast.success("投稿を削除しました");
    },
    onError: (error) => {
      console.error("削除エラー:", error);
      toast.error("削除に失敗しました");
    },
  });

  const handleConfirmDelete = () => {
    if (postsToDelete.length === 0) return;
    hardDeleteMutation.mutate(postsToDelete);
    setDeleteDialogOpen(false);
    setPostsToDelete([]);
  };

  const handleEmptyTrash = () => {
    setIsEmptyTrashDialogOpen(true);
  };

  const handleConfirmEmptyTrash = () => {
    emptyTrashMutation.mutate();
    setIsEmptyTrashDialogOpen(false);
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

  // 選択状態のハンドラ
  const handleSelectChange = (postId: string, checked: boolean) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  };

  // 一括選択のハンドラ
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // 現在表示されている投稿をすべて選択
      setSelectedPostIds(new Set(validPosts.map((p) => p.postId)));
    } else {
      // すべての選択を解除
      setSelectedPostIds(new Set());
    }
  };

  // 全選択状態の判定（表示されている投稿がすべて選択されているか）
  const allSelected =
    validPosts.length > 0 &&
    validPosts.every((p) => selectedPostIds.has(p.postId));
  const selectedCount = selectedPostIds.size;

  return (
    <div>
      {/* ソートコントロール */}
      <PostSortControls />

      {/* モードタイトルと一括選択UI */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900">{modeTitle}</h2>
          {/* ゴミ箱ビューでは一括選択チェックボックスを表示 */}
          {isTrashView && validPosts.length > 0 && !isLoading && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="表示されている投稿を選択"
              />
              <label
                htmlFor="select-all"
                className="text-sm text-slate-600 cursor-pointer"
                onClick={() => handleSelectAll(!allSelected)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectAll(!allSelected);
                  }
                }}
              >
                {selectedCount > 0
                  ? `${selectedCount}件選択中`
                  : "表示されている投稿を選択"}
              </label>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          {validPosts.length > 0 && !isLoading && (
            <span className="text-sm text-slate-500">
              {validPosts.length}件
            </span>
          )}
          {/* ゴミ箱ビューで選択された投稿がある場合、復元ボタンを表示 */}
          {isTrashView && selectedCount > 0 && (
            <Button
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
              variant="default"
              size="sm"
            >
              {restoreMutation.isPending ? "復元中..." : "復元"}
            </Button>
          )}
          {/* ゴミ箱ビューで投稿がある場合、「ゴミ箱を空にする」ボタンを表示 */}
          {isTrashView && validPosts.length > 0 && !isLoading && (
            <Button
              onClick={handleEmptyTrash}
              disabled={emptyTrashMutation.isPending}
              variant="outline"
              size="sm"
            >
              {emptyTrashMutation.isPending ? "削除中..." : "ごみ箱を空にする"}
            </Button>
          )}
        </div>
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
      {!isLoading && validPosts && validPosts.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {validPosts.map((post, index) => (
            <PostItem
              key={post.postId}
              post={post}
              isLast={index === validPosts.length - 1 && !isFetchingNextPage}
              view={view}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isSelected={selectedPostIds.has(post.postId)}
              onSelectChange={handleSelectChange}
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
          {!hasNextPage && validPosts.length > 0 && (
            <div className="p-4 text-center text-sm text-slate-500">
              すべての投稿を取得しました
            </div>
          )}
        </div>
      )}

      {/* データ取得完了後、投稿がない場合の空メッセージ */}
      {!isLoading && validPosts.length === 0 && (
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

      {/* 削除確認モーダル */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {postsToDelete.length === 1
                ? "1件の投稿を完全に削除しますか？"
                : `${postsToDelete.length}件の投稿を完全に削除しますか？`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={hardDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {hardDeleteMutation.isPending ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ゴミ箱を空にする確認モーダル */}
      <AlertDialog
        open={isEmptyTrashDialogOpen}
        onOpenChange={setIsEmptyTrashDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ゴミ箱内のすべての投稿を完全に削除しますか？
            </AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmEmptyTrash}
              disabled={emptyTrashMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {emptyTrashMutation.isPending ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
