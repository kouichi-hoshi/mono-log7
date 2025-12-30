import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
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
    <div className="flex min-h-screen flex-col">
      <AuthenticatedHeader session={session} />
      <div className="flex-1">
        <main>
          <PostList authorId={session.userId} />
        </main>
      </div>
    </div>
  );
}
