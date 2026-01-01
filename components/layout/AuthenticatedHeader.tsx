"use client";

import { UserAvatarButton } from "@/components/auth/UserAvatarButton";

interface AuthenticatedHeaderProps {
  session: {
    userId: string;
    email: string;
    name: string;
  };
}

export function AuthenticatedHeader({ session }: AuthenticatedHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container mx-auto px-4 py-4">
        {/* md以上: 3カラムレイアウト（ロゴ / 中央表示切替枠 / 右ユーザーアイコン） */}
        <div className="hidden md:flex md:items-center md:justify-between">
          <h1 className="text-lg font-semibold">Mono Log</h1>
          {/* 中央: 表示切替UIのプレースホルダ（P1-LAY-07で実装予定） */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-md border-2 border-dashed border-slate-300 rounded px-4 py-2 text-sm text-slate-500 text-center">
              表示切替UI（実装予定）
            </div>
          </div>
          <div className="flex items-center">
            <UserAvatarButton session={session} />
          </div>
        </div>

        {/* md未満: 2カラムレイアウト（ロゴ / 右ユーザーアイコンのみ） */}
        <div className="flex md:hidden items-center justify-between">
          <h1 className="text-lg font-semibold">Mono Log</h1>
          <UserAvatarButton session={session} />
        </div>
      </div>
    </header>
  );
}
