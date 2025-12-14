import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UiPlayground } from "@/components/dev/UiPlayground";

export const metadata: Metadata = {
  title: "UI Playground | Mono Log (dev)",
  description: "開発用のUI確認ページ（本番では表示しない）",
};

export default function DevUiPage() {
  // 本番環境では露出させない（誤って公開しないため）
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-slate-50 text-slate-900">
      <UiPlayground />
    </main>
  );
}
