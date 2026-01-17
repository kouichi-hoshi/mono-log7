"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PostSortControls() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const isTrashView = view === "trash";
  const rawSortBy = searchParams.get("sortBy");
  const currentSortBy =
    rawSortBy === "deletedAt" && isTrashView
      ? "deletedAt"
      : rawSortBy === "createdAt" || rawSortBy === "updatedAt"
        ? rawSortBy
        : isTrashView
          ? "deletedAt"
          : "updatedAt";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";
  const defaultSortBy = isTrashView ? "deletedAt" : "updatedAt";

  const ensureBaseParams = (params: URLSearchParams) => {
    if (!params.get("sortBy")) {
      params.set("sortBy", defaultSortBy);
    }
    if (!params.get("sortOrder")) {
      params.set("sortOrder", "desc");
    }
    if (!params.get("mode")) {
      params.set("mode", "all");
    }
  };

  // 既存のクエリパラメータを保持しつつ、sortBy を更新するヘルパー
  const createSortByLink = (sortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", sortBy);
    ensureBaseParams(params);
    return `/?${params.toString()}`;
  };

  // 既存のクエリパラメータを保持しつつ、sortOrder を更新するヘルパー
  const createSortOrderLink = (sortOrder: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortOrder", sortOrder);
    ensureBaseParams(params);
    return `/?${params.toString()}`;
  };

  return (
    <div
      className="flex items-center gap-2 mb-4 px-4 md:px-0"
      data-testid="post-sort-controls"
    >
      <span className="text-sm text-slate-600">並び順:</span>
      <div className="flex items-center gap-1">
        {/* グループ1: ソートキー選択 */}
        {isTrashView ? (
          <>
            <Button
              variant={currentSortBy === "deletedAt" ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={createSortByLink("deletedAt")}>削除順</Link>
            </Button>
            <Button
              variant={currentSortBy === "updatedAt" ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={createSortByLink("updatedAt")}>更新順</Link>
            </Button>
            <Button
              variant={currentSortBy === "createdAt" ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={createSortByLink("createdAt")}>投稿順</Link>
            </Button>
          </>
        ) : (
          <>
            <Button
              variant={currentSortBy === "updatedAt" ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={createSortByLink("updatedAt")}>更新順</Link>
            </Button>
            <Button
              variant={currentSortBy === "createdAt" ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link href={createSortByLink("createdAt")}>投稿順</Link>
            </Button>
          </>
        )}
      </div>
      <div className="mx-2 h-4 w-px bg-slate-300" />
      <div className="flex items-center gap-1">
        {/* グループ2: 昇順/降順 */}
        <Button
          variant={currentSortOrder === "asc" ? "secondary" : "ghost"}
          size="sm"
          asChild
        >
          <Link href={createSortOrderLink("asc")}>昇順</Link>
        </Button>
        <Button
          variant={currentSortOrder === "desc" ? "secondary" : "ghost"}
          size="sm"
          asChild
        >
          <Link href={createSortOrderLink("desc")}>降順</Link>
        </Button>
      </div>
    </div>
  );
}
