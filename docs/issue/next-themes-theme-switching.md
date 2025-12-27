---
title: （フェーズ2）外観変更（ライト/ダーク/システム）: テーマ切替UI＋永続化＋回帰テスト
labels: ["phase-2", "ui", "layout", "test"]
related_checklist: ["P2-APP-01"]
---

## 背景 / 目的

要件として「外観変更（ライト/ダーク/システム、文字サイズ）」があり、チェックリストにも `P2-APP-01` として計画されている。

本Issueは「テーマ切替の本体（UI・永続化・回帰）」を扱う。
前提として、別Issueで **next-themes の ThemeProvider 導入（基盤）** が完了していることを期待する。

## 前提（依存Issue）

- （今やる）next-themes ThemeProvider 導入（基盤）: RootLayout でのラップと hydration 対策
  - `docs/issue/next-themes-theme-provider-foundation.md`

## ゴール

- ユーザーが UI から `system` / `light` / `dark` を切り替えできる
- 切替がページ全体に反映される（Tailwind の `dark:` が意図通り効く）
- 必要なら永続化される（少なくともリロードで維持される）
- `system` は OS 設定に追従する
- `sonner` の Toaster もテーマに追従する（見た目の不整合がない）

## スコープ

### このIssueでやること

- テーマ切替（`system` / `light` / `dark`）の UI を追加
  - 置き場所は暫定で `AppHeader` など（最終は設計に合わせて調整）
- テーマが UI に反映されることを確認
  - Tailwind の `dark:` を想定（`attribute="class"` 前提）
- 永続化（localStorage等）および `system` 追従が機能することを確認
- `sonner` の Toaster がテーマに追従することを確認（表示の不整合がない）

### このIssueではやらないこと（別Issue）

- 文字サイズの変更（`P2-APP-01` の一部だが、別Issueに分割してもよい）
- カラートークンの全面見直し（デザインシステム刷新）
- DB/認証/投稿などの機能実装

## 受け入れ条件（Done）

- UIから `light` / `dark` / `system` を切り替えできる
- 切り替えがページ全体のスタイルに反映される（例: `dark:` のスタイルが有効化される）
- リロード後も選択したテーマが維持される（永続化）
- `system` 選択時、OSのテーマ設定に追従する
- `sonner` の表示テーマがアプリのテーマに追従する（Toaster の theme が連動）
- テストがGREEN（最低限、テーマ切替UIの動作を担保）

## 実装メモ（案）

- テーマ切替UI
  - まずはシンプルなボタン/メニュー（`system` / `light` / `dark`）
  - 将来的に Popover/Dropdown にしてもよい

## テスト方針（案）

- `ThemeToggle`（仮）コンポーネントのユニットテスト
  - `setTheme` が期待通り呼ばれること（`next-themes` を jest mock）
- （必要なら）E2E
  - トグル操作で `dark` クラスが切り替わる
  - リロード後も維持される（永続化）
  - `system` の基本挙動（可能なら）

## 参照ドキュメント

- `docs/02. 要件定義書.md`
  - 「外観変更（ライト/ダークモードの切り替え、文字サイズの変更）」
  - 「システム設定／ライト／ダークの外観切り替え」
- `docs/04. 作業計画書.md`
  - 「外観変更（システム／ライト／ダーク、文字サイズの変更）」
- `docs/05. 作業計画進行チェックリスト.md`
  - `P2-APP-01 外観変更（ライト/ダーク/システム・文字サイズ）`


