"use client";

import { useQueryClient } from "@tanstack/react-query";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { type PostMode, postRepository } from "@/lib/postRepository";

interface PostEditorProps {
  authorId: string;
}

/**
 * PostEditor
 * 投稿エディタコンポーネント
 * tiptapエディタとモード選択、保存機能を提供
 */
export function PostEditor({ authorId }: PostEditorProps) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<PostMode>("memo");
  const [showEmptyAlert, setShowEmptyAlert] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[100px] max-w-none px-4 py-2",
      },
    },
    // SSR環境では即時描画を無効化し、ハイドレーションのずれを防ぐ
    immediatelyRender: false,
  });

  const handleSave = async () => {
    if (!editor) return;

    const contentJSON = JSON.stringify(editor.getJSON());
    const textContent = editor.getText().trim();

    // 未入力チェック
    if (!textContent) {
      setShowEmptyAlert(true);
      return;
    }

    setIsSaving(true);
    setShowEmptyAlert(false);

    try {
      await postRepository.create({
        authorId,
        contentJSON,
        mode,
      });

      // 成功通知
      toast.success("保存しました");

      // エディタクリア
      editor.commands.clearContent();
      // フォーカスを戻す
      editor.commands.focus("end");

      // 一覧のキャッシュを無効化して再取得
      queryClient.invalidateQueries({
        queryKey: ["posts", { authorId }],
      });
    } catch (error) {
      console.warn("保存エラー:", error);
      // TODO: エラーハンドリングは後続フェーズで実装
    } finally {
      setIsSaving(false);
    }
  };

  // 未入力アラートを自動的に閉じる。アンマウント時や再表示時にタイマーをクリア。
  useEffect(() => {
    if (!showEmptyAlert) return;

    const timer = setTimeout(() => {
      setShowEmptyAlert(false);
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [showEmptyAlert]);

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="space-y-4">
        {/* モード選択 */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-700">モード:</span>
          <div className="flex flex-wrap items-center gap-4">
            {(
              [
                { value: "memo", label: "メモ" },
                { value: "todo", label: "ToDo" },
              ] as const
            ).map(({ value, label }) => {
              const checkboxId = `mode-${value}`;
              const isChecked = mode === value;
              return (
                <label
                  key={value}
                  htmlFor={checkboxId}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <Checkbox
                    id={checkboxId}
                    checked={isChecked}
                    disabled={isSaving}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        setMode(value);
                      }
                    }}
                    aria-label={label}
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* エディタ */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <EditorContent editor={editor} />
        </div>

        {/* 未入力アラート */}
        {showEmptyAlert && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>内容を入力してください</AlertDescription>
          </Alert>
        )}

        {/* 保存ボタン */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || !editor}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
