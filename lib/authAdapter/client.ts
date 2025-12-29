"use client";

import { STUB_SESSION_COOKIE_NAME, USE_STUB_AUTH } from "@/lib/auth/constants";

type StubAction = "signIn" | "signOut";

async function callStubAuthEndpoint(action: StubAction): Promise<void> {
  const response = await fetch("/api/auth/stub", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });

  if (!response.ok) {
    throw new Error(`スタブ認証(${action})に失敗しました`);
  }
}

/**
 * クライアント側で使用するスタブログイン
 */
export async function signIn(): Promise<void> {
  if (!USE_STUB_AUTH) {
    throw new Error("スタブ認証は無効です");
  }
  await callStubAuthEndpoint("signIn");
}

/**
 * クライアント側で使用するスタブログアウト
 */
export async function signOut(): Promise<void> {
  if (!USE_STUB_AUTH) {
    throw new Error("スタブ認証は無効です");
  }
  await callStubAuthEndpoint("signOut");
}

export { USE_STUB_AUTH, STUB_SESSION_COOKIE_NAME };
