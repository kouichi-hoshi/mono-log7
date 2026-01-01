import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PostDTO } from "@/lib/postRepository";

interface PostItemProps {
  post: PostDTO;
  isLast?: boolean;
}

/**
 * PostItem
 * 個別投稿の表示コンポーネント
 */
export function PostItem({ post, isLast = false }: PostItemProps) {
  // tiptap JSONからテキストを抽出（暫定実装）
  let textContent = "";
  try {
    const content = JSON.parse(post.contentJSON);
    if (
      content?.content?.[0]?.content?.[0]?.text &&
      typeof content.content[0].content[0].text === "string"
    ) {
      textContent = content.content[0].content[0].text;
    }
  } catch {
    // JSONパースエラー時は空文字
    textContent = "";
  }

  // モード表示用のラベル
  const modeLabel =
    post.mode === "memo" ? "メモ" : post.mode === "todo" ? "ToDo" : "日記";

  // 日時フォーマット（暫定: Intl.DateTimeFormat使用）
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // モードに応じたバッジの色
  const modeBadgeClass =
    post.mode === "memo"
      ? "bg-blue-100 text-blue-700"
      : post.mode === "todo"
        ? "bg-amber-100 text-amber-700"
        : "bg-purple-100 text-purple-700";

  return (
    <article
      data-testid="post-item"
      className={`p-4 hover:bg-slate-50 transition-colors ${
        !isLast ? "border-b border-slate-100" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* モードと更新日（横並び） */}
          <div className="flex items-center gap-3 mb-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${modeBadgeClass}`}
            >
              {modeLabel}
            </span>
            <time
              dateTime={post.updatedAt.toISOString()}
              className="text-xs text-slate-400"
            >
              {formatDate(post.updatedAt)}
            </time>
          </div>
          {/* 投稿内容 */}
          <p className="text-sm text-slate-800 whitespace-pre-wrap wrap-break-word leading-relaxed">
            {textContent || "(内容なし)"}
          </p>
        </div>
        {/* 右側のアクションボタン群 */}
        <div className="flex items-center gap-1 shrink-0">
          {/* 編集ボタン */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            onClick={() => {
              // TODO: 編集機能実装時に有効化（P1-EDIT-06/07）
              console.log("編集ボタン押下（未実装）");
            }}
            aria-label="編集"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {/* ごみ箱アイコン */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
            onClick={() => {
              // TODO: ごみ箱機能実装時に有効化（P1-LIST-05）
              console.log("ごみ箱ボタン押下（未実装）");
            }}
            aria-label="ごみ箱へ移動"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
