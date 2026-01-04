"use client";

import { UserAvatarButton } from "@/components/auth/UserAvatarButton";
import { ViewSwitcher } from "@/components/layout/ViewSwitcher";

interface AuthenticatedHeaderProps {
  session: {
    userId: string;
    email: string;
    name: string;
  };
}

export function AuthenticatedHeader({ session }: AuthenticatedHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="md:grid md:grid-cols-3 md:items-center">
          {/* md未満: ロゴ+ユーザーアイコン */}
          <div className="flex items-center justify-between md:hidden">
            <h1 className="text-lg font-semibold">Mono Log</h1>
            <UserAvatarButton session={session} />
          </div>

          {/* md以上: ロゴ */}
          <h1 className="hidden text-lg font-semibold md:block">Mono Log</h1>

          {/* 表示切替UI: 1つだけ配置（md未満はfixed bottom-0、md以上はstaticでヘッダー中央） */}
          <div className="flex justify-center">
            <ViewSwitcher />
          </div>

          {/* md以上: ユーザーアイコン */}
          <div className="hidden md:flex md:justify-end">
            <UserAvatarButton session={session} />
          </div>
        </div>
      </div>
    </header>
  );
}
