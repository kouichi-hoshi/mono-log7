"use client";

import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SpinnerWithFade } from "@/components/ui/spinner-with-fade";

export function UiPlayground() {
  // Spinner demo
  const [isLoading, setIsLoading] = useState(false);

  // Checkbox demo (controlled)
  const [checkedControlled, setCheckedControlled] = useState(false);

  // Checkbox demo (uncontrolled)
  const [checkedUncontrolled, setCheckedUncontrolled] = useState(false);

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
        <h2 className="font-medium">sonner</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() =>
              toast.success("保存しました", {
                description: "成功通知の表示確認です",
              })
            }
          >
            成功通知を出す
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              toast.error("失敗しました", {
                description: "エラー通知の表示確認です",
              })
            }
          >
            エラー通知を出す
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast.info("情報", {
                description: "情報通知の表示確認です",
              })
            }
          >
            情報通知を出す
          </Button>
        </div>
        <p className="text-xs text-slate-500">
          sonner を使用した通知実装。画面上部中央に表示されます。
        </p>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Spinner（フェード演出）</h2>
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
          <div className="mt-3">
            <SpinnerWithFade isLoading={isLoading} />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          SpinnerWithFade
          を使用。1秒かけてフェードイン/アウトし、レイアウトシフトを防止します。
        </p>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Alert</h2>
        <div className="space-y-3">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertTitle>デフォルトのAlert</AlertTitle>
            <AlertDescription>
              これはデフォルトバリアントのAlertです。
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>エラーAlert</AlertTitle>
            <AlertDescription>
              これはdestructiveバリアントのAlertです。
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Alert-Dialog（確認モーダル）</h2>
        <div className="flex flex-wrap items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">削除する</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  この操作は取り消せません。データが完全に削除されます。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => toast.success("削除しました")}
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <p className="text-xs text-slate-500">
          確認ダイアログの表示。キャンセル/確定の2ボタン操作、ESC/背景クリックで閉じます。
        </p>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Checkbox</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="controlled"
              checked={checkedControlled}
              onCheckedChange={(checked) =>
                setCheckedControlled(checked === true)
              }
            />
            <label
              htmlFor="controlled"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Controlled Checkbox（現在: {checkedControlled ? "ON" : "OFF"}）
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="uncontrolled"
              defaultChecked={false}
              onCheckedChange={(checked) =>
                setCheckedUncontrolled(checked === true)
              }
            />
            <label
              htmlFor="uncontrolled"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Uncontrolled Checkbox（現在: {checkedUncontrolled ? "ON" : "OFF"}
              ）
            </label>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Controlled/uncontrolled両方のデモ。チェック状態の切替が動作します。
        </p>
      </section>

      <section className="space-y-3 rounded-lg border bg-white p-4">
        <h2 className="font-medium">Popover</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Popoverを開く</Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="space-y-2">
                <h4 className="font-medium">Popoverのタイトル</h4>
                <p className="text-sm text-muted-foreground">
                  これはPopoverのコンテンツです。外側をクリックすると閉じます。
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-xs text-slate-500">
          アイコン押下で開閉、外側クリックで閉じる操作が動作します。
        </p>
      </section>
    </div>
  );
}
