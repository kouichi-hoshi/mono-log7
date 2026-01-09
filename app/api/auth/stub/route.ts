import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { STUB_SESSION_COOKIE_NAME, USE_STUB_AUTH } from "@/lib/auth/constants";

/**
 * スタブ認証用の Route Handler
 * Cookie を使ってセッションを管理する
 * 開発環境のみ有効（NODE_ENV=production では無効）
 */

export async function POST(request: Request) {
  // 本番環境ではスタブ認証を無効化
  if (!USE_STUB_AUTH) {
    return NextResponse.json(
      { error: "スタブ認証は開発環境でのみ利用可能です" },
      { status: 403 },
    );
  }
  const { action } = await request.json();
  const cookieStore = await cookies();

  if (action === "signIn") {
    // スタブセッションを Cookie に保存
    const session = {
      userId: "stub-user-1",
      email: "stub@example.com",
      name: "スタブユーザー",
    };

    cookieStore.set(STUB_SESSION_COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });

    return NextResponse.json({ success: true });
  }

  if (action === "signOut") {
    // Cookie を削除
    cookieStore.delete(STUB_SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
  // 本番環境ではスタブ認証を無効化
  if (!USE_STUB_AUTH) {
    return NextResponse.json(
      { error: "スタブ認証は開発環境でのみ利用可能です" },
      { status: 403 },
    );
  }

  // セッションを取得
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(STUB_SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return NextResponse.json({ session: null });
  }

  try {
    const session = JSON.parse(sessionCookie.value);
    return NextResponse.json({ session });
  } catch {
    // Cookie が不正な場合は削除
    cookieStore.delete(STUB_SESSION_COOKIE_NAME);
    return NextResponse.json({ session: null });
  }
}
