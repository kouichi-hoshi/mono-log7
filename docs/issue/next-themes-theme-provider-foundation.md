---
title: （今やる）next-themes ThemeProvider 導入（基盤）: RootLayout でのラップと hydration 対策
labels: ["phase-1", "layout", "ui", "test"]
related_checklist: ["P2-APP-01"]
---

## 背景 / 目的

現状 `next-themes` は導入されているが、`ThemeProvider` がアプリ全体に適用されていない。
そのため、`useTheme()` を利用している `Toaster`（sonner）が「Provider 不在の状態」で動いている。

本Issueでは **テーマ切替UIは作らず**、まず next-themes の前提となる **ThemeProvider の基盤**を RootLayout に導入して、以降の UI 実装で手戻りが出ない状態にする。

> テーマ切替UI（system/light/dark）、永続化の受け入れ条件、E2E などは別Issue（フェーズ2）で実施する。

## 現状（確認事項）

- `next-themes` は依存関係として存在（`package.json`）
- `useTheme()` の利用箇所は `Toaster` のみ（`components/ui/sonner.tsx`）
- `app/layout.tsx` で `ThemeProvider` によるラップは行っていない

## スコープ

### このIssueでやること

- `ThemeProvider` をアプリ全体に導入（`app/layout.tsx` 配下）
  - 例: `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- hydration warning 対策を入れる（必要なら）
  - 例: `html` に `suppressHydrationWarning`
- `Toaster` が `ThemeProvider` 配下でレンダリングされる構造にする
- 最低限のテストで回帰を担保する（Provider導入により壊れないこと）

### このIssueではやらないこと

- テーマ切替 UI（system/light/dark の操作導線）
- 永続化の受け入れ条件の達成（ユーザー操作での保存確認）
- E2E テスト
- 文字サイズ変更

## 受け入れ条件（Done）

- アプリが `ThemeProvider` 配下で動作している
- 既存ページが hydration / runtime error なく表示できる
- `Toaster`（sonner）が Provider 配下でレンダリングされる
- テストがGREEN（Provider導入の回帰を最低限カバー）

## 実装メモ（案）

- `ThemeProvider` 設定方針
  - `attribute="class"`（Tailwind の `dark:` と整合）
  - `defaultTheme="system"`
  - `enableSystem`
  - `disableTransitionOnChange`（必要なら）

## テスト方針（案）

- `RootLayout` または Provider ラッパーのスモーク（レンダリングが落ちない）
- `Toaster` を含むツリーがレンダリングできること

## 依存 / 後続

- 後続Issue（フェーズ2）: テーマ切替UI＋永続化＋E2E（必要なら）

## 参照ドキュメント

- `docs/02. 要件定義書.md`
  - 「外観変更（ライト/ダークモードの切り替え、文字サイズの変更）」
  - 「システム設定／ライト／ダークの外観切り替え」
- `docs/04. 作業計画書.md`
  - 「外観変更（システム／ライト／ダーク、文字サイズの変更）」
- `docs/05. 作業計画進行チェックリスト.md`
  - `P2-APP-01 外観変更（ライト/ダーク/システム・文字サイズ）`


