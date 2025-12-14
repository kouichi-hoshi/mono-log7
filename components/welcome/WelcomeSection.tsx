"use client";

import { Github, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeSectionProps {
  onLoginClick: () => void;
}

export function WelcomeSection({ onLoginClick }: WelcomeSectionProps) {
  return (
    <main
      className="container mx-auto px-4 py-8 text-center"
      style={{ textAlign: "center" }}
    >
      <div className="mx-auto max-w-2xl space-y-8">
        <h1 className="mb-4 text-3xl font-bold">
          メモとTODOリストをまとめて管理しましょう
        </h1>
        <Button size="lg" onClick={onLoginClick} className="mt-4">
          ログイン
        </Button>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">このアプリについて</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              アプリ開発の学習のために制作した、
              <br />
              シンプルなメモ/ToDoアプリです。
            </p>
            <p>
              どなたでも無料でお試しいただけます。
              <br />
              機密情報等は入力しないようお願いします。
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">免責事項</h2>
          <div className="space-y-2 text-muted-foreground">
            <p>
              このアプリは予告なく変更・削除される場合があります。
              <br />
              アプリのご利用に際しては、すべて利用者の責任においてご利用ください。
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="sr-only">Link</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/kouichi-hoshi"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-input text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href="https://x.com/stella_d_tweet"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-input text-muted-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <Button variant="outline" asChild>
              <a
                href="https://stella-d.net/#contact"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="お問い合わせ"
                className="text-sm font-medium"
              >
                お問い合わせ
              </a>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
