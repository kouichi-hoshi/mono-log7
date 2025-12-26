## Vercel + Neon + GitHub Actions セットアップ手順

本番デプロイを「main ブランチへ push → 必要なときだけ Prisma マイグレーション → Vercel Deploy Hook」の流れで行うためのセットアップ手順です。

---

### 1. Neon（本番 PostgreSQL）の準備

1. Neon で新しいプロジェクト（PostgreSQL 17 推奨）を作成。
2. **プール接続 URL（PgBouncer）** と **直結 URL（Direct）** を控える。
   - `DATABASE_URL` : アプリ（Vercel）から使用。`postgresql://...pgbouncer.neon.tech/neondb?sslmode=require&pooler=pgbouncer`
   - `DATABASE_DIRECT_URL` : GitHub Actions から `prisma migrate deploy` を実行する際に使用。`postgresql://...neon.tech/neondb?sslmode=require`
3. 開発・テスト用にローカル PostgreSQL（Homebrew）を利用するため、Neon の権限は本番用だけで OK。

---

### 2. Vercel プロジェクトの設定

1. Vercel で `mono-log` リポジトリをインポート。
2. **Environment Variables** に以下を設定（Production / Preview / Development すべてに同じ値を設定するのがおすすめ）。

| 変数名 | 内容 |
| --- | --- |
| `DATABASE_URL` | Neon のプールされた接続 URL（PgBouncer） |
| `DATABASE_DIRECT_URL` | Neon の Direct URL（将来のために保存。アプリは使わない） |
| `AUTH_SECRET` | `openssl rand -base64 32` などで生成 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console の OAuth クレデンシャル |
| その他 `NEXT_PUBLIC_*` | 必要に応じて設定 |

3. **Deploy Hooks** を作成（Settings → Git → Deploy Hooks）。
   - Hook 名： `main` など
   - Hook URL をコピーしておく（`VERCEL_DEPLOY_HOOK_URL` として GitHub Secrets に登録する）。
4. Vercel の GitHub 自動デプロイ（main への push で即デプロイ）は **OFF** にする。
   - 今後は GitHub Actions → Deploy Hook でデプロイをトリガーする。

---

### 3. GitHub Secrets の設定

リポジトリの **Settings → Secrets and variables → Actions** で以下を登録。

| Secret 名 | 内容 |
| --- | --- |
| `DATABASE_DIRECT_URL` | Neon の Direct 接続 URL（`postgresql://...neon.tech/neondb?sslmode=require`） |
| `VERCEL_DEPLOY_HOOK_URL` | Vercel で発行した Deploy Hook URL |

> `DATABASE_URL` は Vercel の環境変数でのみ使用。GitHub Actions では `DATABASE_DIRECT_URL` を参照する。

---

### 4. GitHub Actions（`.github/workflows/db-migrate-and-deploy.yml`）の挙動

1. `main` ブランチへの push をトリガー。
2. `prisma/migrations/` に変更があるかを `git diff --quiet` で確認。
   - 変更が **ある** → `pnpm db:migrate:deploy` を実行し、Neon にマイグレーション適用 → 成功後に Deploy Hook を POST。
   - 変更が **ない** → 「No changes detected...」ログを出して何もしない。
3. `pnpm db:migrate:deploy` は `package.json` で `pnpm exec prisma migrate deploy` を呼び出すスクリプト。

> `VERCEL_DEPLOY_HOOK_URL` を未設定の場合、マイグレーションだけ実行して終了します（デプロイは手動で呼び出し）。

---

### 5. ローカル開発手順の整理

1. Homebrew PostgreSQL 17 を起動し、`mono_log_dev` / `mono_log_test` DB を作成。
2. `.env.local` `.env.test` を以下のように記述（gitignore 済み）。

```env
DATABASE_URL="postgresql://kouichi@localhost:5432/mono_log_dev?schema=public"
DATABASE_DIRECT_URL="postgresql://kouichi@localhost:5432/mono_log_dev?schema=public"
AUTH_SECRET="ローカル用シークレット"
GOOGLE_CLIENT_ID="ローカル用/検証用"
GOOGLE_CLIENT_SECRET="同上"
```

3. 開発: `pnpm dev`
4. スキーマ変更時: `pnpm exec prisma migrate dev` → `pnpm exec prisma db seed`（必要に応じて）
5. テスト: `pnpm test`（テスト DB をリセットしてから Jest 実行）
6. 開発用エラー通知シミュレーション
   - ローカル環境で次のような URL にアクセスすると、対応するエラー／成功のsonner通知が表示される想定
     - `http://localhost:3000/?errorTest=auth` → 認証エラー
     - `http://localhost:3000/?errorTest=authorization` → 認可エラー
     - `http://localhost:3000/?errorTest=notfound` → Not Found エラー
     - `http://localhost:3000/?errorTest=validation` → バリデーションエラー
     - `http://localhost:3000/?errorTest=server` → サーバーエラー
     - `http://localhost:3000/?errorTest=generic` → 一般的なエラー
     - `http://localhost:3000/?errorTest=success` → 成功メッセージ
   - sonner通知表示後は URL から `?errorTest=...` が削除され、リロードしても再発火しない
   - 本番環境（`NODE_ENV === "production"`）ではこの機能は無効化される

---

### 6. デプロイの流れ

1. PR を `main` にマージすると GitHub Actions が起動。
2. `prisma/migrations` に差分がある場合のみ Neon に `prisma migrate deploy` を実行。
3. 成功後、`VERCEL_DEPLOY_HOOK_URL` を叩いて Vercel が `next build` → デプロイ。
4. Vercel 上の環境変数でアプリが Neon の `DATABASE_URL` を参照する。

---

### 7. トラブルシューティング

- **マイグレーションが失敗した**
  - GitHub Actions のログでエラーを確認 → 修正したマイグレーションを再 push。
  - 必要であれば `DATABASE_DIRECT_URL` を使い手動で `npx prisma migrate deploy` を実行。

- **Vercel Deploy Hook を間違えて削除した**
  - 新しい Hook を作成し、GitHub Secrets の `VERCEL_DEPLOY_HOOK_URL` を更新。

- **Preview を試したい**
  - Preview 用の Neon ブランチを作り、`DATABASE_URL` を差し替えた Vercel Preview 環境を別途用意する。

---

これで main ブランチへのマージをきっかけに「必要なときだけマイグレーション → Vercel デプロイ」が自動的に実行される構成になります。必要に応じて、Deploy Hook ではなく Vercel の GitHub 自動デプロイを再度有効化しても構いません（その場合は `db-migrate-and-deploy.yml` の Deploy Hook 呼び出しを削除してください）。

