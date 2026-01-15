# B. `status` と `deletedAt` の整合性メモ（ソフト削除）

## 背景

`Post` はゴミ箱機能のために以下2つを持つ。

- `status`: `active` / `trashed`
- `deletedAt`: `DateTime?`（ゴミ箱投入日時）

実装上は、

- ソフト削除: `status=trashed` かつ `deletedAt=now`
- 復元: `status=active` かつ `deletedAt=null`

というペア更新を前提にしている。

## 現状の良い点

- ゴミ箱状態を **明確なenum** (`status`) として持つため、一覧取得でのフィルタが単純
- `deletedAt` を持つことで「いつゴミ箱に入ったか」を保持でき、将来の自動削除などにも繋げやすい

## 課題（不整合が入りうる）

DBレベルの制約がないため、将来的に以下の不整合が混入し得る。

- `status=active` なのに `deletedAt != null`
- `status=trashed` なのに `deletedAt == null`

現状のコードパスが健全でも、将来の変更やバグ、スクリプト等で混入する可能性はゼロではない。

## 対策案

### 1) アプリ層での一貫更新を徹底（現状方針の強化）

- ソフト削除/復元を必ず同じ接続ポイント（Repository/Usecase）経由に集約する
- 直接 `status` だけを更新する経路を作らない
- テストで「ペア更新」を契約として固定する

メリット: DB変更不要で進められる  
デメリット: 不正データ混入の最終防波堤がアプリに依存する

### 2) DBレベルで整合性制約を導入（将来検討）

例（概念）:

- `status='active' -> deletedAt IS NULL`
- `status='trashed' -> deletedAt IS NOT NULL`

注意:

- Prismaだけでは表現しづらく、マイグレーションでのCHECK制約等が必要になる領域
- 既存データの整合性確認も必要

メリット: データの最終的な正しさをDBが担保できる  
デメリット: スキーマ/マイグレーション運用が少し重くなる

## 補足（ゴミ箱の並び順との関係）

`deletedAt` は「ゴミ箱投入日時」なので、ゴミ箱一覧のソートに使うなら `deletedAt` を `orderBy` に含める必要がある。
その場合、インデックスも `deletedAt` を含む形を検討する（例: `authorId,status,deletedAt,postId`）。

