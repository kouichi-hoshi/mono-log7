"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { signOut } from "@/lib/authAdapter/client";

interface UserPopoverProps {
  children: ReactNode;
  session: {
    userId: string;
    email: string;
    name: string;
  };
}

/**
 * ユーザーポップオーバー
 * ユーザー名とログアウト導線を表示
 */
export function UserPopover({ children, session }: UserPopoverProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = async () => {
    startTransition(async () => {
      try {
        await signOut();
        router.refresh();
      } catch (error) {
        console.error("ログアウトエラー:", error);
        // エラーハンドリングは後続フェーズで実装
      }
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">ユーザー名</p>
            <p className="text-xs text-slate-500">{session.name}</p>
          </div>
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
              disabled={isPending}
            >
              {isPending ? "処理中..." : "ログアウト"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
