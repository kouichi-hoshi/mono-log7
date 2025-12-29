import { cookies } from "next/headers";
import { STUB_SESSION_COOKIE_NAME, USE_STUB_AUTH } from "@/lib/auth/constants";

export type StubSession = {
  userId: string;
  email: string;
  name: string;
};

/**
 * サーバー側でスタブセッションを取得
 */
export async function getSession(): Promise<StubSession | null> {
  if (!USE_STUB_AUTH) {
    return null;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(STUB_SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    return JSON.parse(sessionCookie.value) as StubSession;
  } catch {
    cookieStore.delete(STUB_SESSION_COOKIE_NAME);
    return null;
  }
}

export { USE_STUB_AUTH, STUB_SESSION_COOKIE_NAME };
