import type { PostDTO } from "@/lib/postRepository";

interface PostItemProps {
  post: PostDTO;
}

/**
 * PostItem
 * 個別投稿の表示コンポーネント
 */
export function PostItem({ post }: PostItemProps) {
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

  return (
    <article
      data-testid="post-item"
      className="border-b border-slate-200 py-4 px-4 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {modeLabel}
            </span>
            <time
              dateTime={post.updatedAt.toISOString()}
              className="text-xs text-slate-500"
            >
              {formatDate(post.updatedAt)}
            </time>
          </div>
          <p className="text-sm text-slate-900 whitespace-pre-wrap break-words">
            {textContent || "(内容なし)"}
          </p>
        </div>
      </div>
    </article>
  );
}
