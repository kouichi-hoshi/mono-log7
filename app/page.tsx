import { samplePosts } from "./mock/samplePosts";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          {/* 左: アプリ名 */}
          <div className="flex items-center gap-3">
            <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-sm text-white shadow-md">
                M
              </span>
              <span className="hidden sm:inline">Mono Log</span>
            </h1>
          </div>

          {/* 中央: 表示切替 */}
          <nav className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            {["すべて", "メモ", "ToDo"].map((label, index) => (
              <button
                key={label}
                type="button"
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                  index === 0
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* 右: アクション */}
          <div className="flex items-center gap-2">
            <a
              href="/trash"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:inline-flex"
            >
              🗑️ ごみ箱
            </a>
            <div className="hidden h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md transition-transform hover:scale-105 md:flex">
              K
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
              aria-label="メニューを開く"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <div className="grid gap-6 md:grid-cols-[380px_minmax(0,1fr)] md:gap-8">
          {/* 左カラム: 投稿エディタ */}
          <section className="md:sticky md:top-24 md:self-start">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
              {/* エディタヘッダー */}
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    新規投稿
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    メモやToDoを記録しましょう
                  </p>
                </div>
              </div>

              {/* エディタ本体 */}
              <div className="p-5">
                <div className="min-h-[120px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-400 transition-colors focus-within:border-indigo-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100">
                  投稿内容をここに入力...
                </div>

                {/* カテゴリ切替＋アクションボタン */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-1.5">
                    {["メモ", "ToDo"].map((label, index) => (
                      <button
                        key={label}
                        type="button"
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${
                          index === 0
                            ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-300"
                  >
                    保存する
                  </button>
                </div>
              </div>

              {/* スタブ表示注記 */}
              <div className="border-t border-slate-100 bg-amber-50 px-5 py-2.5">
                <p className="text-xs text-amber-700">
                  ⚠️ スタブ表示中 — 実装時に機能を接続します
                </p>
              </div>
            </div>
          </section>

          {/* 右カラム: 投稿一覧 */}
          <section className="space-y-4">
            {/* タイムラインヘッダー */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  タイムライン
                </h2>
                <p className="text-sm text-slate-500">最近の投稿</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  更新順
                </button>
                <button
                  type="button"
                  className="rounded-md px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  投稿順
                </button>
              </div>
            </div>

            {/* 投稿カード一覧 */}
            <div className="space-y-3">
              {samplePosts.map((post) => (
                <article
                  key={post.id}
                  className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                >
                  {/* カードヘッダー */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          post.category === "ToDo"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {post.category === "ToDo" ? "📋" : "📝"} {post.category}
                      </span>
                      <span className="text-xs text-slate-400">
                        {post.updatedAt}
                      </span>
                    </div>

                    {/* アクションボタン */}
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        aria-label="編集"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label="ごみ箱に移動"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="cursor-grab rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                        aria-label="並び替え"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8h16M4 16h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 本文 */}
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    {post.body}
                  </p>

                  {/* フッター */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
                    <span>作成: {post.createdAt}</span>
                    <span className="font-mono">{post.id}</span>
                  </div>
                </article>
              ))}
            </div>

            {/* もっと読み込む */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:shadow"
              >
                さらに読み込む
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* フッター */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-sm text-slate-500 sm:flex-row md:px-8">
          <span>© 2025 Mono Log</span>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              スタブ表示
            </span>
            <span className="text-slate-400">機能は未接続です</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
