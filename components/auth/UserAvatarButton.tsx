"use client";

import { UserPopover } from "./UserPopover";

interface UserAvatarButtonProps {
  session: {
    userId: string;
    email: string;
    name: string;
  };
}

/**
 * ユーザーアバターボタン
 * クリックでポップオーバーを開く
 */
export function UserAvatarButton({ session }: UserAvatarButtonProps) {
  return (
    <UserPopover session={session}>
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-full border-2 border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        aria-label="ユーザーメニューを開く"
      >
        <span className="text-sm font-semibold">U</span>
      </button>
    </UserPopover>
  );
}
