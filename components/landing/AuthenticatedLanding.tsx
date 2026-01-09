"use client";

import { useState } from "react";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";
import { PostEditor } from "@/components/timeline/PostEditor";
import { PostList } from "@/components/timeline/PostList";
import type { PostDTO, PostMode } from "@/lib/postRepository";

interface AuthenticatedLandingProps {
  session: {
    userId: string;
    email: string;
    name: string;
  };
  searchParams?: {
    mode?: string;
    view?: string;
    sortBy?: string;
    sortOrder?: string;
  };
}

export function AuthenticatedLanding({
  session,
  searchParams = {},
}: AuthenticatedLandingProps) {
  // mode の検証と正規化
  const mode =
    searchParams.mode === "memo" ||
    searchParams.mode === "todo" ||
    searchParams.mode === "diary"
      ? (searchParams.mode as PostMode)
      : searchParams.mode === "all"
        ? "all"
        : "all";

  const view = searchParams.view === "trash" ? "trash" : undefined;

  // sortBy/sortOrder の検証と正規化
  const sortBy =
    searchParams.sortBy === "updatedAt" || searchParams.sortBy === "createdAt"
      ? (searchParams.sortBy as "updatedAt" | "createdAt")
      : "updatedAt";

  const sortOrder =
    searchParams.sortOrder === "asc" || searchParams.sortOrder === "desc"
      ? (searchParams.sortOrder as "asc" | "desc")
      : "desc";

  // 編集中の投稿を管理
  const [editingPost, setEditingPost] = useState<PostDTO | undefined>(
    undefined,
  );

  const handleEdit = (post: PostDTO) => {
    setEditingPost(post);
  };

  const handleFinishEdit = () => {
    setEditingPost(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthenticatedHeader session={session} />
      {/* ヘッダー分の余白を追加（fixedヘッダーの高さ約72px） */}
      <main className="pb-20 pt-[72px] md:pb-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col gap-6 md:flex-row md:gap-8">
            {/* エディタ（md以上でstickyでヘッダー下に固定） */}
            <div className="md:w-[420px] md:shrink-0 md:sticky md:top-[72px] md:self-start">
              <PostEditor
                authorId={session.userId}
                editingPost={editingPost}
                onFinishEdit={handleFinishEdit}
              />
            </div>
            {/* 投稿一覧 */}
            <div className="md:flex-1 md:min-w-0">
              <PostList
                authorId={session.userId}
                mode={mode}
                view={view}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onEdit={handleEdit}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
