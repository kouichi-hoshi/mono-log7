/**
 * 投稿リポジトリ向けの環境依存設定
 */
export function shouldUseStubPosts(): boolean {
  return (
    process.env.NEXT_PUBLIC_USE_STUB_POSTS === "true" &&
    process.env.NODE_ENV !== "production"
  );
}
