import { shouldUseStubPosts } from "@/lib/config/postRepositoryConfig";

// テスト前の環境変数の値を保存（テスト後に復元するため）
const originalNodeEnv = process.env.NODE_ENV;
const originalStubFlag = process.env.NEXT_PUBLIC_USE_STUB_POSTS;

/**
 * 環境変数を設定するヘルパー関数
 * TypeScriptの型エラーを回避するため、Object.definePropertyを使用
 */
function setEnv(key: string, value: string): void {
  Object.defineProperty(process.env, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

/**
 * 環境変数を削除するヘルパー関数
 */
function deleteEnv(key: string): void {
  delete (process.env as Record<string, string | undefined>)[key];
}

/**
 * 環境変数を元の値に復元するヘルパー関数
 * 値がundefinedの場合は削除、それ以外は設定する
 */
function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    deleteEnv(key);
  } else {
    setEnv(key, value);
  }
}

/**
 * postRepositoryConfigのテストスイート
 * shouldUseStubPosts関数が環境変数に応じて正しくtrue/falseを返すことを確認する
 */
describe("postRepositoryConfig", () => {
  // 各テスト後に環境変数を元の値に復元して、テスト間の影響を防ぐ
  afterEach(() => {
    restoreEnv("NODE_ENV", originalNodeEnv);
    restoreEnv("NEXT_PUBLIC_USE_STUB_POSTS", originalStubFlag);
  });

  // 本番環境（NODE_ENV=production）では、NEXT_PUBLIC_USE_STUB_POSTSがtrueでもfalseを返すことを確認
  it("NODE_ENV=production では false を返す", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_USE_STUB_POSTS", "true");

    expect(shouldUseStubPosts()).toBe(false);
  });

  // NEXT_PUBLIC_USE_STUB_POSTS=falseの場合、NODE_ENVがdevelopmentでもfalseを返すことを確認
  it("NEXT_PUBLIC_USE_STUB_POSTS=false では false を返す", () => {
    setEnv("NODE_ENV", "development");
    setEnv("NEXT_PUBLIC_USE_STUB_POSTS", "false");

    expect(shouldUseStubPosts()).toBe(false);
  });

  // NODE_ENV=development かつ NEXT_PUBLIC_USE_STUB_POSTS=true の両方を満たす場合、trueを返すことを確認
  it("スタブ有効条件を満たすと true を返す", () => {
    setEnv("NODE_ENV", "development");
    setEnv("NEXT_PUBLIC_USE_STUB_POSTS", "true");

    expect(shouldUseStubPosts()).toBe(true);
  });
});
