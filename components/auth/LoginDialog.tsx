"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { signIn } from "@/lib/authAdapter/client";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleGoogleSignIn = async () => {
    startTransition(async () => {
      try {
        await signIn();
        onOpenChange(false);
        // 画面B実装後は適切なルートに遷移
        router.refresh();
      } catch (error) {
        console.error("ログインエラー:", error);
        // エラーハンドリングは後続フェーズで実装
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ログイン</DialogTitle>
          <DialogDescription>
            Googleアカウントでサインインし、Mono Log の機能をご利用ください。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? "処理中..." : "Googleアカウントでログイン"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
