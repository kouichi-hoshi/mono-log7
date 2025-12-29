import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const STUB_SESSION_COOKIE_NAME = "stub-session";

/**
 * スタブ認証用の Route Handler
 * Cookie を使ってセッションを管理する
 */

export async function POST(request: Request) {
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
