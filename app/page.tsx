import type { Metadata } from "next";
import { AuthenticatedLanding } from "@/components/landing/AuthenticatedLanding";
import { UnauthenticatedLanding } from "@/components/landing/UnauthenticatedLanding";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mono Log - メモとTODOリストをまとめて管理",
  description: "シンプルなメモ/ToDoアプリ",
};

interface HomeProps {
  searchParams: Promise<{
    mode?: string;
    view?: string;
  }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getSession();
  const params = await searchParams;

  if (session) {
    return (
      <AuthenticatedLanding
        session={session}
        searchParams={{
          mode: params.mode || "all",
          view: params.view,
        }}
      />
    );
  }

  return <UnauthenticatedLanding />;
}
