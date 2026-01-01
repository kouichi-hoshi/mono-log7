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
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AuthenticatedHeader session={session} />
      <div className="flex-1">
        <main>
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-6 md:flex-row md:gap-8">
              {/* エディタ（md以上でsticky） */}
              <div className="md:w-[420px] md:flex-shrink-0 md:sticky md:top-6 md:self-start">
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
    </div>
  );
}
