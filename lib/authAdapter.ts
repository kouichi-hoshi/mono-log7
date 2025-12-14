/**
 * 認証アダプタ
 * スタブ/本番の認証処理を切り替える接続ポイント
 */

// 環境変数によるスタブ切替
const USE_STUB_AUTH =
  process.env.NEXT_PUBLIC_USE_STUB_AUTH === "true" &&
  process.env.NODE_ENV !== "production";

// スタブセッション管理（メモリ上）
let stubSession: { userId: string; email: string; name: string } | null = null;

/**
 * スタブ認証: ログイン
 */
async function stubSignIn(): Promise<void> {
  if (!USE_STUB_AUTH) {
    throw new Error("スタブ認証は無効です");
  }
  // スタブセッションを作成
  stubSession = {
    userId: "stub-user-1",
    email: "stub@example.com",
    name: "スタブユーザー",
  };
}

/**
 * スタブ認証: ログアウト
 */
async function stubSignOut(): Promise<void> {
  if (!USE_STUB_AUTH) {
    throw new Error("スタブ認証は無効です");
  }
  stubSession = null;
}

/**
 * スタブ認証: セッション取得
 */
async function stubGetSession(): Promise<{
  userId: string;
  email: string;
  name: string;
} | null> {
  if (!USE_STUB_AUTH) {
    return null;
  }
  return stubSession;
}

/**
 * 認証アダプタ（公開API）
 * 環境変数に応じてスタブ/本番を切り替える
 */
export const authAdapter = {
  /**
   * ログイン
   */
  async signIn(): Promise<void> {
    if (USE_STUB_AUTH) {
      await stubSignIn();
      return;
    }
    // 本番実装はフェーズ2で実装
    throw new Error("本番認証は未実装です");
  },

  /**
   * ログアウト
   */
  async signOut(): Promise<void> {
    if (USE_STUB_AUTH) {
      await stubSignOut();
      return;
    }
    // 本番実装はフェーズ2で実装
    throw new Error("本番認証は未実装です");
  },

  /**
   * セッション取得
   */
  async getSession(): Promise<{
    userId: string;
    email: string;
    name: string;
  } | null> {
    if (USE_STUB_AUTH) {
      return await stubGetSession();
    }
    // 本番実装はフェーズ2で実装
    return null;
  },
};
