/**
 * @jest-environment node
 *
 * Auth.js導入後に「authorId偽装が不可能」であることを担保するための契約テスト（今は未実装なのでskip）。
 *
 * 目的:
 * - リクエストの authorId を信用せず、サーバ側でセッション由来の user.id を基準に認可すること
 *
 * 実装が入ったらこのテストを有効化してGreenにする（P2-AUTH-01 の完了条件に含める想定）。
 */

describe.skip("contract: posts API authorization (after Auth.js)", () => {
  it("rejects when request authorId does not match session user.id (403)", async () => {
    // Arrange:
    // - セッションユーザー: user-A
    // - リクエスト: authorId = user-B
    //
    // Expect:
    // - 403 を返す、もしくは authorId が user-A に強制される
  });
});
