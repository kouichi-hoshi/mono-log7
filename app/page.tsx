import type { Metadata } from "next";
import { UnauthenticatedLanding } from "@/components/landing/UnauthenticatedLanding";

export const metadata: Metadata = {
  title: "Mono Log - メモとTODOリストをまとめて管理",
  description: "シンプルなメモ/ToDoアプリ",
};

export default function Home() {
  // 暫定的に未ログインビューを表示
  // ミドルウェアでのセッション判定は後続フェーズで実装
  return <UnauthenticatedLanding />;
}
