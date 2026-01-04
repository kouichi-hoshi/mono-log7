"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ViewSwitcher() {
  return (
    <nav
      aria-label="表示切替"
      data-testid="view-switcher"
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(15,23,42,0.08)] md:static md:inset-auto md:z-auto md:border md:border-t md:rounded-full md:shadow-sm md:bg-slate-50/80 md:max-w-fit"
    >
      <div className="flex items-center justify-center gap-2 px-4 py-3 md:gap-1 md:px-2 md:py-1.5">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/?mode=all">すべて</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/?mode=memo">メモ</Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/?mode=todo">ToDo</Link>
        </Button>
        <div className="mx-2 h-4 w-px bg-slate-300 md:mx-1" />
        <Button variant="ghost" size="sm" asChild>
          <Link href="/?view=trash">ごみ箱を見る</Link>
        </Button>
      </div>
    </nav>
  );
}
