"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ViewSwitcher() {
  const searchParams = useSearchParams();
  const currentMode = searchParams.get("mode") || "all";
  const currentView = searchParams.get("view");

  // 既存のクエリパラメータを保持しつつ、mode を更新するヘルパー
  const createModeLink = (mode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", mode);
    // view=trash の場合は削除（通常表示に戻る）
    if (params.get("view") === "trash") {
      params.delete("view");
    }
    // ゴミ箱専用のソートキーは通常ビューでは削除
    if (params.get("sortBy") === "deletedAt") {
      params.set("sortBy", "updatedAt");
    }
    if (!params.get("sortBy")) {
      params.set("sortBy", "updatedAt");
    }
    // sortOrderのデフォルトを補完
    if (!params.get("sortOrder")) {
      params.set("sortOrder", "desc");
    }
    return `/?${params.toString()}`;
  };

  // 既存のクエリパラメータを保持しつつ、view を更新するヘルパー
  const createViewLink = (view: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view) {
      params.set("view", view);
      // ゴミ箱ビューでは削除日時ソートをデフォルトにする
      params.set("sortBy", "deletedAt");
      // ゴミ箱は「捨てた順」= 降順を強制
      params.set("sortOrder", "desc");
    } else {
      params.delete("view");
      if (params.get("sortBy") === "deletedAt") {
        params.set("sortBy", "updatedAt");
      }
    }
    if (!params.get("sortBy")) {
      params.set("sortBy", view ? "deletedAt" : "updatedAt");
    }
    // mode が未設定の場合は all を設定
    if (!params.get("mode")) {
      params.set("mode", "all");
    }
    if (!params.get("sortOrder")) {
      params.set("sortOrder", "desc");
    }
    return `/?${params.toString()}`;
  };

  return (
    <nav
      aria-label="表示切替"
      data-testid="view-switcher"
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(15,23,42,0.08)] md:static md:inset-auto md:z-auto md:border md:border-t md:rounded-full md:shadow-sm md:bg-slate-50/80 md:max-w-fit"
    >
      <div className="flex items-center justify-center gap-2 px-4 py-3 md:gap-1 md:px-2 md:py-1.5">
        <Button
          variant={
            currentMode === "all" && !currentView ? "secondary" : "ghost"
          }
          size="sm"
          asChild
        >
          <Link href={createModeLink("all")}>すべて</Link>
        </Button>
        <Button
          variant={
            currentMode === "memo" && !currentView ? "secondary" : "ghost"
          }
          size="sm"
          asChild
        >
          <Link href={createModeLink("memo")}>メモ</Link>
        </Button>
        <Button
          variant={
            currentMode === "todo" && !currentView ? "secondary" : "ghost"
          }
          size="sm"
          asChild
        >
          <Link href={createModeLink("todo")}>ToDo</Link>
        </Button>
        <div className="mx-2 h-4 w-px bg-slate-300 md:mx-1" />
        <Button
          variant={currentView === "trash" ? "secondary" : "ghost"}
          size="sm"
          asChild
        >
          <Link href={createViewLink(currentView === "trash" ? null : "trash")}>
            ごみ箱を見る
          </Link>
        </Button>
      </div>
    </nav>
  );
}
