"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PostSortControls() {
  const searchParams = useSearchParams();
  const currentSortBy = searchParams.get("sortBy") || "updatedAt";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

  // 既存のクエリパラメータを保持しつつ、sortBy を更新するヘルパー
  const createSortByLink = (sortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", sortBy);
    // sortByが未設定の場合はupdatedAtを設定
    if (!params.get("sortBy")) {
      params.set("sortBy", "updatedAt");
    }
    // sortOrderが未設定の場合はdescを設定
    if (!params.get("sortOrder")) {
      params.set("sortOrder", "desc");
    }
    // modeが未設定の場合はallを設定
    if (!params.get("mode")) {
      params.set("mode", "all");
    }
    return `/?${params.toString()}`;
  };

  // 既存のクエリパラメータを保持しつつ、sortOrder を更新するヘルパー
  const createSortOrderLink = (sortOrder: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortOrder", sortOrder);
    // sortByが未設定の場合はupdatedAtを設定
    if (!params.get("sortBy")) {
      params.set("sortBy", "updatedAt");
    }
    // sortOrderが未設定の場合はdescを設定
    if (!params.get("sortOrder")) {
      params.set("sortOrder", "desc");
    }
    // modeが未設定の場合はallを設定
    if (!params.get("mode")) {
      params.set("mode", "all");
    }
    return `/?${params.toString()}`;
  };

  return (
    <div
      className="flex items-center gap-2 mb-4 px-4 md:px-0"
      data-testid="post-sort-controls"
    >
      <span className="text-sm text-slate-600">並び順:</span>
      <div className="flex items-center gap-1">
        {/* グループ1: 更新順/投稿順 */}
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
