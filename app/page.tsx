import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthenticatedLanding } from "@/components/landing/AuthenticatedLanding";
import { UnauthenticatedLanding } from "@/components/landing/UnauthenticatedLanding";
import { normalizeHomeSearchParams } from "@/lib/routing/normalizeHomeSearchParams";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mono Log - メモとTODOリストをまとめて管理",
  description: "シンプルなメモ/ToDoアプリ",
};

interface HomeProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Home({ searchParams }: HomeProps) {
  const session = await getSession();
  const params = await searchParams;

  if (session) {
    // ログイン中はsearchParamsを正規化し、変更があればredirect
    const { normalized, changed } = normalizeHomeSearchParams(params);

    if (changed) {
      // 正規化されたURLにリダイレクト
      const canonicalUrl = `/?${normalized.toString()}`;
      redirect(canonicalUrl);
    }

    // 正規化済みのsearchParamsをAuthenticatedLandingに渡す
    return (
      <AuthenticatedLanding
        session={session}
        searchParams={{
          mode: normalized.get("mode") || "all",
          view: normalized.get("view") || undefined,
        }}
      />
    );
  }

  return <UnauthenticatedLanding />;
}
