"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DemoToast = {
  id: string;
  variant: "success" | "error";
  title: string;
  description?: string;
};

function randomId() {
  return Math.random().toString(16).slice(2);
}

export function UiPlayground() {
  // Spinner demo
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRenderSpinner, setShouldRenderSpinner] = useState(false);
  const spinnerUnmountTimerRef = useRef<number | null>(null);

  // Toast demo (temporary; replace when shadcn Toast is implemented)
  const [toasts, setToasts] = useState<DemoToast[]>([]);

  const toastContainerAriaLive = useMemo(() => {
    // success/info could be polite; errors should be assertive.
    return toasts.some((t) => t.variant === "error") ? "assertive" : "polite";
  }, [toasts]);

  useEffect(() => {
    if (spinnerUnmountTimerRef.current !== null) {
      window.clearTimeout(spinnerUnmountTimerRef.current);
      spinnerUnmountTimerRef.current = null;
    }

    if (isLoading) {
      setShouldRenderSpinner(true);
      return;
    }

    // Fade-out duration: 1000ms (keep mounted during fade)
    spinnerUnmountTimerRef.current = window.setTimeout(() => {
      setShouldRenderSpinner(false);
      spinnerUnmountTimerRef.current = null;
    }, 1000);
  }, [isLoading]);

  function addToast(next: Omit<DemoToast, "id">) {
    const id = randomId();
    const toast: DemoToast = { id, ...next };
    setToasts((prev) => [toast, ...prev]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-10 p-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">UI Playground（開発用）</h1>
        <p className="text-sm text-slate-600">
          shadcn/ui
          コンポーネントの見た目と挙動を、ブラウザ上で確認するためのページです。
          （本番環境では表示しません）
        </p>
      </header>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Dialog</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Dialogを開く</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog の確認</DialogTitle>
                <DialogDescription>
                  ボタンで開く / ×ボタン / 背景クリック / ESC
                  で閉じられるか確認してください。
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                ここにコンテンツが入ります。
              </div>
              <DialogFooter>
                <Button variant="secondary">閉じる（×/背景でも可）</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-xs text-slate-500">
          注: このページは見た目確認用です。Dialog
          の閉じるボタン（secondary）は、
          実装時の導線に合わせて適宜差し替えてください。
        </p>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Toast（仮実装）</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() =>
              addToast({
                variant: "success",
                title: "保存しました",
                description: "成功トーストの表示確認です（仮）",
              })
            }
          >
            成功Toastを出す
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              addToast({
                variant: "error",
                title: "失敗しました",
                description: "エラートーストの表示確認です（仮）",
              })
            }
          >
            エラーToastを出す
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          注: ここは shadcn の Toast
          を入れるまでの暫定表示です。Toastコンポーネント実装後は
          このブロックを置き換えてください。
        </p>

        <div
          aria-live={toastContainerAriaLive}
          aria-relevant="additions removals"
          className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={
                t.variant === "error"
                  ? "pointer-events-auto rounded-md border border-red-200 bg-red-50 p-3 shadow-sm"
                  : "pointer-events-auto rounded-md border border-emerald-200 bg-emerald-50 p-3 shadow-sm"
              }
            >
              <div className="text-sm font-medium">{t.title}</div>
              {t.description && (
                <div className="text-xs text-slate-700">{t.description}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Spinner（仮実装）</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setIsLoading(true)}>
            表示（フェードイン）
          </Button>
          <Button variant="secondary" onClick={() => setIsLoading(false)}>
            非表示（フェードアウト）
          </Button>
        </div>

        <div className="mt-3 min-h-16 rounded-md border bg-slate-50 p-4">
          <div className="text-xs text-slate-500">
            状態: {isLoading ? "loading" : "idle"}
          </div>
          {shouldRenderSpinner && (
            <div
              className={
                isLoading
                  ? "mt-3 inline-flex items-center gap-2 opacity-100 transition-opacity duration-1000"
                  : "mt-3 inline-flex items-center gap-2 opacity-0 transition-opacity duration-1000"
              }
            >
              <div
                role="img"
                aria-label="loading"
                className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
              />
              <span className="text-sm text-slate-700">読み込み中…</span>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500">
          注: ここは P1-UI-02 の Spinner
          実装前の暫定です。Spinnerコンポーネント実装後は
          このブロックを置き換えてください。
        </p>
      </section>

      <section className="space-y-2 rounded-lg border bg-white p-4">
        <h2 className="font-medium">今後追加予定</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Alert / Alert-Dialog（確認モーダルの挙動）</li>
          <li>Checkbox（controlled / uncontrolled）</li>
          <li>Popover（外側クリックで閉じる等）</li>
        </ul>
      </section>
    </div>
  );
}
