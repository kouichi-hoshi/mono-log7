import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";

interface AuthenticatedLandingProps {
  session: {
    userId: string;
    email: string;
    name: string;
  };
}

export function AuthenticatedLanding({ session }: AuthenticatedLandingProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <AuthenticatedHeader session={session} />
      <div className="flex-1">
        {/* 後続のメイン領域（エディタ・一覧）は別タスクで実装 */}
        <main className="container mx-auto px-4 py-8">
          <p>ログイン中（画面B）</p>
        </main>
      </div>
    </div>
  );
}
