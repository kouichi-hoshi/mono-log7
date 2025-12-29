/**
 * セッション判定ユーティリティ
 * Server Componentやミドルウェアから利用する
 */

import { getSession as getServerSession } from "@/lib/authAdapter/server";

/**
 * 現在のセッションを取得する
 * @returns セッション情報、未ログインの場合はnull
 */
export async function getSession() {
  return await getServerSession();
}

/**
 * ログイン状態かどうかを判定する
 * @returns ログイン中の場合true、未ログインの場合false
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
