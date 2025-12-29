import type { Metadata } from "next";
import { AuthenticatedLanding } from "@/components/landing/AuthenticatedLanding";
import { UnauthenticatedLanding } from "@/components/landing/UnauthenticatedLanding";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Mono Log - メモとTODOリストをまとめて管理",
  description: "シンプルなメモ/ToDoアプリ",
};

export default async function Home() {
  const session = await getSession();

  if (session) {
    return <AuthenticatedLanding session={session} />;
  }

  return <UnauthenticatedLanding />;
}
