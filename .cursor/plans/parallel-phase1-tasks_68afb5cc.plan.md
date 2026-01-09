---
name: parallel-phase1-tasks
overview: P1-FLT-01/P1-TRASH-01-02/P1-RSK-01を並行で仕上げるための実装計画です。TDDとスタブ方針を維持しつつ、UI挙動・ゴミ箱ビュー・運用ドキュメントをそれぞれ完了させます。
todos:
  - id: flt01-tests
    content: "P1-FLT-01: ViewSwitcherテスト整備"
    status: pending
  - id: trash-view
    content: "P1-TRASH-01/02: ゴミ箱ビュー実装"
    status: pending
    dependencies:
      - flt01-tests
  - id: stub-risk-docs
    content: "P1-RSK-01: 認証スタブ運用ガード文書化"
    status: pending
---

# フェーズ1優先タスク並行実装プラン

## スコープとゴール

- `P1-FLT-01`：`ViewSwitcher` の表示切替ボタン群をテスト含めて完了させ、一覧フィルタが mode と連動することを保証。
- `P1-TRASH-01/02`：`view=trash` でゴミ箱ビューへ切り替え、`PostList` が trashed 投稿のみを表示する UI/テストを整備。
- `P1-RSK-01`：認証スタブ運用ガードを `docs/03-05` に明文化し、CI/本番でスタブ無効を確認できるドキュメントを追記。

## 実行順序と依存

1. **chore/p1-flt-01**（短時間で☑化可能、後続のゴミ箱実装と重なる境界が少ない）
2. **feat/p1-trash-01**（`ViewSwitcher` の挙動を前提に `AuthenticatedLanding` と `PostList` を拡張）
3. **docs/p1-rsk-01**（コード依存が薄く並行でも支障なし。完了後にチェックリスト更新）

### worktreeでの並列実行ガイド

- ルートで `git fetch --all --prune` 後、`../mono-log7-wt` など作業用ディレクトリを用意。
- タスクごとに worktree を追加し、独立したブランチで実装する。
  ```bash
  git worktree add -b chore/p1-flt-01 ../mono-log7-wt/p1-flt-01
  git worktree add -b feat/p1-trash-01 ../mono-log7-wt/p1-trash-01
  git worktree add -b docs/p1-rsk-01 ../mono-log7-wt/p1-rsk-01
  ```

- それぞれの worktree で `pnpm install`（未実行なら）→ `pnpm test` を実行し、TDD で進める。
- マージは影響範囲の小さい順（docs → chore → feat）に進めるとコンフリクトを避けやすい。

## 詳細ステップ

### P1-FLT-01（`components/layout/ViewSwitcher.tsx`、`components/landing/AuthenticatedLanding.tsx`）

1. **Red**: `__tests__/components/layout/ViewSwitcher.test.tsx` を新規作成。

- mode ボタンの表示／variant 切替、リンク生成（`mode` 上書き＋ `view` 解除）をテスト。
- `AuthenticatedLanding` に `searchParams.mode` → `PostList` の `mode` 連携スモークを追加。

2. **Green**: 足りない props/ハンドラを補強（必要なら `ViewSwitcher` へ `className` や props 追加）。
3. **Refactor**: `docs/05` の `P1-FLT-01` を ☑ 化できる根拠（テスト名）を記載。

### P1-TRASH-01/02（`components/landing/AuthenticatedLanding.tsx`、`components/timeline/PostList.tsx`）

1. **Red**: `__tests__/components/landing/authenticated-landing.test.tsx` と `__tests__/components/timeline/PostList.test.tsx` に `view=trash` シナリオを追加。

- Landing: `searchParams.view="trash"` で `PostList` に `view="trash"` を渡す。
- PostList: `view="trash"` のとき `postRepository.findMany` が `status="trashed"` を使う、active を外す、mode を無視する。

2. **Green**: `PostList` のクエリキー生成・クエリオプションを分岐させ、ゴミ箱 UI の空状態/Skeleton を整備。`ViewSwitcher` の「ごみ箱を見る」リンクからの遷移も確認。
3. **Refactor**: `docs/05` の `P1-TRASH-01/02` 完了コメントにテスト名を追記。

### P1-RSK-01（`docs/03. 設計書.md`, `docs/04. 作業計画書.md`, `docs/05. 作業計画進行チェックリスト.md`）

1. **現状調査**: スタブ認証の説明箇所を確認（`docs/03` 既存節）。
2. **追記**:

- `docs/03`：`authAdapter` スタブの利用制限、CI/本番で `NEXT_PUBLIC_USE_STUB_AUTH` を無効化する手順。
- `docs/04`：`P1-RSK-01` のリスクと対策を深掘り（Cookieの扱い、環境変数ガード、確認手順）。
- `docs/05`：`P1-RSK-01` 行に完了条件（該当ドキュメント節とテスト/CIチェックアウトライン）を記載。

3. **確認**: 必要なら `__tests__/lib/session.test.ts` 等にスタブ無効化の追加テストを検討（記録のみで済む場合は実装不要）。

## 参考ファイル

- `components/layout/ViewSwitcher.tsx`
- `components/landing/AuthenticatedLanding.tsx`
- `components/timeline/PostList.tsx`
- `__tests__/components/layout/authenticated-header.test.tsx`
- `docs/03. 設計書.md`, `docs/04. 作業計画書.md`, `docs/05. 作業計画進行チェックリスト.md`
