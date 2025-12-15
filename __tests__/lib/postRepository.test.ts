// 環境変数のモック
const originalEnv = process.env;

describe("postRepository", () => {
  let postRepository: typeof import("@/lib/postRepository").postRepository;
  let resetStubStore: typeof import("@/lib/postRepository").resetStubStore;

  beforeEach(async () => {
    // 環境変数をリセットし、スタブを有効化
    process.env = { ...originalEnv };
    process.env.NODE_ENV = "development";
    process.env.NEXT_PUBLIC_USE_STUB_POSTS = "true";

    // モジュールキャッシュをクリアして再読み込み
    jest.resetModules();
    const module = await import("@/lib/postRepository");
    postRepository = module.postRepository;
    resetStubStore = module.resetStubStore;
    // スタブストアをリセット
    resetStubStore();
  });

  afterAll(() => {
    // 環境変数を復元
    process.env = originalEnv;
  });

  describe("環境変数ガード", () => {
    it("NODE_ENV=production ではスタブが無効になる", async () => {
      process.env.NODE_ENV = "production";
      process.env.NEXT_PUBLIC_USE_STUB_POSTS = "true";

      await expect(
        postRepository.create({
          authorId: "test-user",
          contentJSON: '{"type":"doc"}',
          mode: "memo",
        }),
      ).rejects.toThrow("本番投稿CRUDは未実装です");
    });

    it("NEXT_PUBLIC_USE_STUB_POSTS=false ではスタブが無効になる", async () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_USE_STUB_POSTS = "false";

      await expect(
        postRepository.create({
          authorId: "test-user",
          contentJSON: '{"type":"doc"}',
          mode: "memo",
        }),
      ).rejects.toThrow("本番投稿CRUDは未実装です");
    });

    it("スタブ有効時はcreateが動作する", async () => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_USE_STUB_POSTS = "true";

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

  describe("create", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_USE_STUB_POSTS = "true";
    });

    it("投稿を作成できる", async () => {
      const input = {
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

  describe("findMany", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_USE_STUB_POSTS = "true";
    });

    it("デフォルトで10件取得できる（更新日降順）", async () => {
      // 初期データ（samplePostsから20件）がロードされている
      const posts = await postRepository.findMany();

      expect(posts.length).toBeLessThanOrEqual(10);
      // 更新日降順でソートされているか確認
      for (let i = 0; i < posts.length - 1; i++) {
        expect(posts[i].updatedAt.getTime()).toBeGreaterThanOrEqual(
          posts[i + 1].updatedAt.getTime(),
        );
      }
    });

    it("modeでフィルタできる", async () => {
      const memoPosts = await postRepository.findMany({ mode: "memo" });
      const todoPosts = await postRepository.findMany({ mode: "todo" });

      expect(memoPosts.every((p) => p.mode === "memo")).toBe(true);
      expect(todoPosts.every((p) => p.mode === "todo")).toBe(true);
    });

    it("statusでフィルタできる", async () => {
      // 1件をゴミ箱に移動
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

    it("limitで件数を制限できる", async () => {
      const posts = await postRepository.findMany({ limit: 5 });

      expect(posts.length).toBeLessThanOrEqual(5);
    });

    it("offsetでページネーションできる", async () => {
      const firstPage = await postRepository.findMany({ limit: 5, offset: 0 });
      const secondPage = await postRepository.findMany({
        limit: 5,
        offset: 5,
      });

      expect(firstPage.length).toBeLessThanOrEqual(5);
      expect(secondPage.length).toBeLessThanOrEqual(5);
      // 重複がないことを確認
      const firstIds = new Set(firstPage.map((p) => p.postId));
      const secondIds = new Set(secondPage.map((p) => p.postId));
      expect([...firstIds].some((id) => secondIds.has(id))).toBe(false);
    });

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

      // 降順
      for (let i = 0; i < updatedDesc.length - 1; i++) {
        expect(updatedDesc[i].updatedAt.getTime()).toBeGreaterThanOrEqual(
          updatedDesc[i + 1].updatedAt.getTime(),
        );
      }

      // 昇順
      for (let i = 0; i < updatedAsc.length - 1; i++) {
        expect(updatedAsc[i].updatedAt.getTime()).toBeLessThanOrEqual(
          updatedAsc[i + 1].updatedAt.getTime(),
        );
      }
    });
  });

  describe("findById", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_USE_STUB_POSTS = "true";
    });

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

    it("存在しない投稿はnullを返す", async () => {
      const found = await postRepository.findById("non-existent-id");

      expect(found).toBeNull();
    });
  });

  describe("update", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_USE_STUB_POSTS = "true";
    });

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
      expect(updated.mode).toBe("memo"); // 変更されていない
    });

    it("存在しない投稿の更新はエラー", async () => {
      await expect(
        postRepository.update("non-existent-id", {
          contentJSON: '{"type":"doc"}',
        }),
      ).rejects.toThrow("投稿が見つかりません");
    });
  });

  describe("softDelete", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_USE_STUB_POSTS = "true";
    });

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

      // activeな投稿一覧からは除外される
      const activePosts = await postRepository.findMany({ status: "active" });
      expect(
        activePosts.find((p) => p.postId === created.postId),
      ).toBeUndefined();

      // trashedな投稿一覧には含まれる
      const trashedPosts = await postRepository.findMany({
        status: "trashed",
      });
      expect(
        trashedPosts.find((p) => p.postId === created.postId),
      ).toBeDefined();
    });

    it("存在しない投稿の削除はエラー", async () => {
      await expect(
        postRepository.softDelete("non-existent-id"),
      ).rejects.toThrow("投稿が見つかりません");
    });
  });

  describe("restore", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_USE_STUB_POSTS = "true";
    });

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

      // activeな投稿一覧に含まれる
      const activePosts = await postRepository.findMany({ status: "active" });
      expect(
        activePosts.find((p) => p.postId === created.postId),
      ).toBeDefined();
    });

    it("存在しない投稿の復元はエラー", async () => {
      await expect(postRepository.restore("non-existent-id")).rejects.toThrow(
        "投稿が見つかりません",
      );
    });
  });

  describe("hardDelete", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development";
      process.env.NEXT_PUBLIC_USE_STUB_POSTS = "true";
    });

    it("投稿を完全削除できる", async () => {
      const created = await postRepository.create({
        authorId: "test-user",
        contentJSON: '{"type":"doc"}',
        mode: "memo",
      });

      await postRepository.hardDelete(created.postId);

      const found = await postRepository.findById(created.postId);
      expect(found).toBeNull();

      // どの一覧からも除外される
      const allPosts = await postRepository.findMany();
      expect(allPosts.find((p) => p.postId === created.postId)).toBeUndefined();
    });

    it("存在しない投稿の削除はエラー", async () => {
      await expect(
        postRepository.hardDelete("non-existent-id"),
      ).rejects.toThrow("投稿が見つかりません");
    });
  });
});
