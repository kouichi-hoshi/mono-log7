# D. 残タスク（status / deletedAt 整合性）

## 背景
- `status` と `deletedAt` の整合性ガードを追加済み
- dev/test では例外で検知、production ではログのみで継続

## 残タスク
1. **production時の方針を明文化**
   - 不整合が混入した場合の扱い（ログのみで継続 / 例外で停止 / 隔離）
   - 監視・通知の運用（ログ集約、アラート条件、対応フロー）

2. **不整合データの影響整理**
   - `status=active` かつ `deletedAt!=null` の場合:
     - 通常一覧に表示されるがゴミ箱に表示されない
     - `emptyTrash` で削除対象にならず残る可能性
   - `status=trashed` かつ `deletedAt==null` の場合:
     - ゴミ箱に表示されるが削除日時が欠落する

3. **整合性検知後の修復方針**
   - 運用での補正手順（手動/スクリプト）
   - どの値を正とするか（`status` vs `deletedAt`）

4. **ゴミ箱関連の仕様判断**
   - ゴミ箱一覧の並び順（`deletedAt` を採用するか）
   - `emptyTrash` 条件を `status` 前提のままにするか見直すか

## 参考
- `B_status-deletedAt-consistency.md`
- `C_trash-sort-spec-gap.md`
