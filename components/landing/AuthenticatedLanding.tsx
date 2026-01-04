import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { PostEditor } from "@/components/timeline/PostEditor";
import { PostList } from "@/components/timeline/PostList";

interface AuthenticatedLandingProps {
  session: {
    userId: string;
    email: string;
    name: string;
  };
}

export function AuthenticatedLanding({ session }: AuthenticatedLandingProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AuthenticatedHeader session={session} />
      {/* ヘッダー分の余白を追加（fixedヘッダーの高さ約72px） */}
      <main className="pb-20 pt-[72px] md:pb-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            {/* エディタ（md以上でstickyでヘッダー下に固定） */}
            <div className="md:w-[420px] md:shrink-0 md:sticky md:top-[72px] md:self-start">
              <PostEditor authorId={session.userId} />
            </div>
            {/* 投稿一覧 */}
            <div className="md:flex-1 md:min-w-0">
              <PostList authorId={session.userId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
