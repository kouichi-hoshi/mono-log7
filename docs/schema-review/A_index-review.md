---
status: done
completed_at: 2026-01-15
summary: >
  Post一覧の複合カーソル（sortBy+postId）と mode有無×createdAt/updatedAt
  インデックスを導入し、マイグレーション 20260115010218_posts_index_and_cursor_rework
  を作成。API/スタブ/クライアントを新cursor仕様に揃え、無効cursorは無視する
  バリデーションを追加。
---

# A. インデックス設計の見直しメモ（Post 一覧取得）

## 背景

現状の `Post` は以下のアクセスパターンで頻繁に参照される。

- 通常ビュー
  - `where`: `authorId = ?` + `status = active` + `mode`（`mode=all` の場合は **mode条件なし**）
  - `orderBy`: `updatedAt` または `createdAt`
  - ページング: `cursor`（`postId`）ベース
- ゴミ箱ビュー（`view=trash`）
  - `where`: `authorId = ?` + `status = trashed`（**mode条件なし**）
  - `orderBy`: `updatedAt` または `createdAt`
  - ページング: `cursor`（`postId`）ベース

## 現状

`schema.prisma` の `Post` は以下のインデックスを持つ。

- `@@index([authorId, status, mode, updatedAt])`
- `@@index([authorId, createdAt])`

## 課題（問題になりやすい点）

### 1) `mode` 未指定（mode=all / trash）時にインデックスが噛みづらい

`@@index([authorId, status, mode, updatedAt])` は `updatedAt` が `mode` の後ろにあるため、
`mode` がクエリ条件に存在しないケースで **`orderBy updatedAt` の走査に効きにくい**。

### 2) ソートの安定性（同一タイムスタンプ）の懸念

`updatedAt` / `createdAt` が同値のレコードが存在する場合、DB側の並びが不安定になる可能性がある。
cursorページングでは「同値が多い + 不安定ソート」だと、ページング境界で重複/欠落を起こすリスクが上がる。

## 改善案（候補）

### 最小で効かせる方針（mode未指定を重視）

通常・ゴミ箱両方で効きやすいように、`mode` を含まない複合インデックスを用意する。

- `@@index([authorId, status, updatedAt, postId])`
- `@@index([authorId, status, createdAt, postId])`

`postId` を末尾に含めることで、同一タイムスタンプの安定ソートの足しになる。

### mode指定の絞り込みも重視する方針（memo/todo/diaryでの一覧が支配的なら）

modeでのフィルタが常に入る画面/機能が多い場合は、現状の形を踏襲して末尾に `postId` を追加する。

- `@@index([authorId, status, mode, updatedAt, postId])`

※ただし、mode未指定のケース（mode=all / trash）が存在するなら、上記だけでは不足しやすい。

## 判断材料（採用前に確認したいこと）

- 一覧取得の主要パターンはどれか
  - `mode=all` の比率（mode条件なし）が高いか
  - ゴミ箱の閲覧頻度
  - `sortBy=createdAt` を使う比率
- `updatedAt` が同値になり得る頻度（作成/更新が短時間に集中するケース）

## 次アクション

1. 実際のクエリ（通常/ゴミ箱 × updatedAt/createdAt × asc/desc）を確定する
2. 上記を満たす最小インデックス集合を決める
3. スキーマ変更が必要なら、運用手順に従いマイグレーションとして扱う（勝手に適用しない）

