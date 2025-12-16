import { shouldUseStubPosts } from "@/lib/config/postRepositoryConfig";
import type { CreatePostInput } from "@/lib/postRepository";

// 設定モジュールをモック化して、テスト時にスタブ切り替えを制御できるようにする
jest.mock("@/lib/config/postRepositoryConfig", () => ({
  shouldUseStubPosts: jest.fn(),
}));

const mockedShouldUseStubPosts = shouldUseStubPosts as jest.MockedFunction<
  typeof shouldUseStubPosts
>;

/**
 * postRepositoryのテストスイート
 * スタブ/本番切り替え、CRUD操作の各機能をテストする
 */
describe("postRepository", () => {
  let postRepository: typeof import("@/lib/postRepository").postRepository;
  let resetStubStore: typeof import("@/lib/postRepository").resetStubStore;

  beforeAll(async () => {
    mockedShouldUseStubPosts.mockReturnValue(true);
    const module = await import("@/lib/postRepository");
    postRepository = module.postRepository;
    resetStubStore = module.resetStubStore;
  });

  // 各テスト前にスタブを有効化し、ストアをリセットしてクリーンな状態にする
  beforeEach(() => {
    mockedShouldUseStubPosts.mockReturnValue(true);
    resetStubStore();
    jest.clearAllMocks();
    mockedShouldUseStubPosts.mockReturnValue(true);
  });

  /**
   * スタブ切り替え機能のテスト
   * スタブ有効/無効時の挙動を確認する
   */
  describe("スタブ切り替え", () => {
    // スタブ無効時に本番実装が呼ばれ、未実装エラーが発生することを確認
    it("スタブが無効な場合は本番未実装エラーになる", async () => {
      mockedShouldUseStubPosts.mockReturnValue(false);

      await expect(
        postRepository.create({
          authorId: "test-user",
          contentJSON: '{"type":"doc"}',
          mode: "memo",
        }),
      ).rejects.toThrow("本番投稿CRUDは未実装です");
    });

    // スタブ有効時にcreateメソッドが正常に動作することを確認
    it("スタブが有効な場合はcreateが動作する", async () => {
      mockedShouldUseStubPosts.mockReturnValue(true);

      const result = await postRepository.create({
        authorId: "test-user",
        contentJSON: '{"type":"doc"}',
        mode: "memo",
      });

      expect(result).toMatchObject({
        authorId: "test-user",
        contentJSON: '{"type":"doc"}',
        mode: "memo",
        status: "active",
      });
      expect(result.postId).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(result.deletedAt).toBeNull();
    });
  });

  /**
   * 投稿作成機能のテスト
   * createメソッドの基本的な動作を確認する
   */
  describe("create", () => {
    // 正常な入力で投稿が作成され、期待通りの値が返されることを確認
    it("投稿を作成できる", async () => {
      const input: CreatePostInput = {
        authorId: "test-user-1",
        contentJSON:
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"テスト投稿"}]}]}',
        mode: "memo",
      };

      const result = await postRepository.create(input);

      expect(result.postId).toBeDefined();
      expect(result.authorId).toBe("test-user-1");
      expect(result.contentJSON).toBe(input.contentJSON);
      expect(result.mode).toBe("memo");
      expect(result.status).toBe("active");
      expect(result.deletedAt).toBeNull();
    });

    // 作成した投稿がfindManyで取得できることを確認（作成と取得の連携をテスト）
    it("作成した投稿はfindManyで取得できる", async () => {
      const created = await postRepository.create({
        authorId: "test-user-1",
        contentJSON: '{"type":"doc"}',
        mode: "todo",
      });

      const posts = await postRepository.findMany();
      const found = posts.find((p) => p.postId === created.postId);

      expect(found).toBeDefined();
      expect(found?.mode).toBe("todo");
    });
  });

  /**
   * 投稿一覧取得機能のテスト
   * フィルタリング、ソート、ページネーションなどの機能を確認する
   */
  describe("findMany", () => {
    // デフォルトで最大10件が取得され、更新日時の降順でソートされることを確認
    it("デフォルトで10件取得できる（更新日降順）", async () => {
      const posts = await postRepository.findMany();

      expect(posts.length).toBeLessThanOrEqual(10);
      for (let i = 0; i < posts.length - 1; i++) {
        expect(posts[i].updatedAt.getTime()).toBeGreaterThanOrEqual(
          posts[i + 1].updatedAt.getTime(),
        );
      }
    });

    // modeパラメータでメモ/ToDoなどの種別でフィルタリングできることを確認
    it("modeでフィルタできる", async () => {
      const memoPosts = await postRepository.findMany({ mode: "memo" });
      const todoPosts = await postRepository.findMany({ mode: "todo" });

      expect(memoPosts.every((p) => p.mode === "memo")).toBe(true);
      expect(todoPosts.every((p) => p.mode === "todo")).toBe(true);
    });

    // statusパラメータでactive/trashedの状態でフィルタリングできることを確認
    it("statusでフィルタできる", async () => {
      const posts = await postRepository.findMany();
      if (posts.length > 0) {
        await postRepository.softDelete(posts[0].postId);

        const activePosts = await postRepository.findMany({ status: "active" });
        const trashedPosts = await postRepository.findMany({
          status: "trashed",
        });

        expect(activePosts.every((p) => p.status === "active")).toBe(true);
        expect(trashedPosts.length).toBeGreaterThan(0);
        expect(trashedPosts[0].status).toBe("trashed");
      }
    });

    // limitパラメータで取得件数を制限できることを確認
    it("limitで件数を制限できる", async () => {
      const posts = await postRepository.findMany({ limit: 5 });

      expect(posts.length).toBeLessThanOrEqual(5);
    });

    // offsetとlimitを組み合わせてページネーションができること、重複がないことを確認
    it("offsetでページネーションできる", async () => {
      const firstPage = await postRepository.findMany({ limit: 5, offset: 0 });
      const secondPage = await postRepository.findMany({
        limit: 5,
        offset: 5,
      });

      expect(firstPage.length).toBeLessThanOrEqual(5);
      expect(secondPage.length).toBeLessThanOrEqual(5);
      const firstIds = new Set(firstPage.map((p) => p.postId));
      const secondIds = new Set(secondPage.map((p) => p.postId));
      expect([...firstIds].some((id) => secondIds.has(id))).toBe(false);
    });

    // sortByとsortOrderでソート順（昇順/降順）を制御できることを確認
    it("sortByとsortOrderでソートできる", async () => {
      const updatedDesc = await postRepository.findMany({
        sortBy: "updatedAt",
        sortOrder: "desc",
        limit: 10,
      });
      const updatedAsc = await postRepository.findMany({
        sortBy: "updatedAt",
        sortOrder: "asc",
        limit: 10,
      });

      for (let i = 0; i < updatedDesc.length - 1; i++) {
        expect(updatedDesc[i].updatedAt.getTime()).toBeGreaterThanOrEqual(
          updatedDesc[i + 1].updatedAt.getTime(),
        );
      }

      for (let i = 0; i < updatedAsc.length - 1; i++) {
        expect(updatedAsc[i].updatedAt.getTime()).toBeLessThanOrEqual(
          updatedAsc[i + 1].updatedAt.getTime(),
        );
      }
    });
  });

  /**
   * ID指定での投稿取得機能のテスト
   * 存在する/しない投稿の取得を確認する
   */
  describe("findById", () => {
    // 存在する投稿IDで取得できることを確認
    it("存在する投稿を取得できる", async () => {
      const created = await postRepository.create({
        authorId: "test-user",
        contentJSON: '{"type":"doc"}',
        mode: "memo",
      });

      const found = await postRepository.findById(created.postId);

      expect(found).toBeDefined();
      expect(found?.postId).toBe(created.postId);
    });

    // 存在しない投稿IDの場合はnullが返されることを確認
    it("存在しない投稿はnullを返す", async () => {
      const found = await postRepository.findById("non-existent-id");

      expect(found).toBeNull();
    });
  });

  /**
   * 投稿更新機能のテスト
   * 全フィールド更新と部分更新を確認する
   */
  describe("update", () => {
    // 投稿のcontentJSONとmodeを更新できること、updatedAtが更新されることを確認
    it("投稿を更新できる", async () => {
      const created = await postRepository.create({
        authorId: "test-user",
        contentJSON:
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"元の内容"}]}]}',
        mode: "memo",
      });

      const updated = await postRepository.update(created.postId, {
        contentJSON:
          '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"更新後の内容"}]}]}',
        mode: "todo",
      });

      expect(updated.contentJSON).toContain("更新後の内容");
      expect(updated.mode).toBe("todo");
      expect(updated.postId).toBe(created.postId);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(
        created.updatedAt.getTime(),
      );
    });

    // contentJSONのみを更新し、modeは変更されないことを確認（部分更新の動作確認）
    it("部分更新ができる（contentJSONのみ）", async () => {
      const created = await postRepository.create({
        authorId: "test-user",
        contentJSON: '{"type":"doc"}',
        mode: "memo",
      });

      const updated = await postRepository.update(created.postId, {
        contentJSON: '{"type":"doc","content":[]}',
      });

      expect(updated.contentJSON).toBe('{"type":"doc","content":[]}');
      expect(updated.mode).toBe("memo");
    });

    // 存在しない投稿IDで更新しようとするとエラーが発生することを確認
    it("存在しない投稿の更新はエラー", async () => {
      await expect(
        postRepository.update("non-existent-id", {
          contentJSON: '{"type":"doc"}',
        }),
      ).rejects.toThrow("投稿が見つかりません");
    });
  });

  /**
   * ソフト削除機能のテスト
   * 投稿をゴミ箱に移動する機能を確認する
   */
  describe("softDelete", () => {
    // 投稿がtrashed状態になり、active一覧から除外され、trashed一覧に含まれることを確認
    it("投稿をゴミ箱に移動できる", async () => {
      const created = await postRepository.create({
        authorId: "test-user",
        contentJSON: '{"type":"doc"}',
        mode: "memo",
      });

      await postRepository.softDelete(created.postId);

      const found = await postRepository.findById(created.postId);
      expect(found?.status).toBe("trashed");
      expect(found?.deletedAt).not.toBeNull();

      const activePosts = await postRepository.findMany({ status: "active" });
      expect(
        activePosts.find((p) => p.postId === created.postId),
      ).toBeUndefined();

      const trashedPosts = await postRepository.findMany({
        status: "trashed",
      });
      expect(
        trashedPosts.find((p) => p.postId === created.postId),
      ).toBeDefined();
    });

    // 存在しない投稿IDでソフト削除しようとするとエラーが発生することを確認
    it("存在しない投稿の削除はエラー", async () => {
      await expect(
        postRepository.softDelete("non-existent-id"),
      ).rejects.toThrow("投稿が見つかりません");
    });
  });

  /**
   * 復元機能のテスト
   * ゴミ箱から投稿を復元する機能を確認する
   */
  describe("restore", () => {
    // ゴミ箱の投稿がactive状態に戻り、active一覧に含まれることを確認
    it("ゴミ箱から復元できる", async () => {
      const created = await postRepository.create({
        authorId: "test-user",
        contentJSON: '{"type":"doc"}',
        mode: "memo",
      });

      await postRepository.softDelete(created.postId);
      await postRepository.restore(created.postId);

      const found = await postRepository.findById(created.postId);
      expect(found?.status).toBe("active");
      expect(found?.deletedAt).toBeNull();

      const activePosts = await postRepository.findMany({ status: "active" });
      expect(
        activePosts.find((p) => p.postId === created.postId),
      ).toBeDefined();
    });

    // 存在しない投稿IDで復元しようとするとエラーが発生することを確認
    it("存在しない投稿の復元はエラー", async () => {
      await expect(postRepository.restore("non-existent-id")).rejects.toThrow(
        "投稿が見つかりません",
      );
    });
  });

  /**
   * 完全削除機能のテスト
   * 投稿を完全に削除する機能を確認する
   */
  describe("hardDelete", () => {
    // 投稿が完全に削除され、findByIdでもfindManyでも取得できなくなることを確認
    it("投稿を完全削除できる", async () => {
      const created = await postRepository.create({
        authorId: "test-user",
        contentJSON: '{"type":"doc"}',
        mode: "memo",
      });

      await postRepository.hardDelete(created.postId);

      const found = await postRepository.findById(created.postId);
      expect(found).toBeNull();

      const allPosts = await postRepository.findMany();
      expect(allPosts.find((p) => p.postId === created.postId)).toBeUndefined();
    });

    // 存在しない投稿IDで完全削除しようとするとエラーが発生することを確認
    it("存在しない投稿の削除はエラー", async () => {
      await expect(
        postRepository.hardDelete("non-existent-id"),
      ).rejects.toThrow("投稿が見つかりません");
    });
  });
});
