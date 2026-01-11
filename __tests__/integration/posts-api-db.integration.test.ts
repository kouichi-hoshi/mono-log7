/**
 * @jest-environment node
 *
 * DB実接続の統合テスト（任意実行）
 * - Route Handler（/api/posts/**）→ Prisma → PostgreSQL がつながってCRUDできることを確認する
 *
 * 実行方法（例）:
 *   RUN_DB_INTEGRATION_TESTS=true pnpm test -- __tests__/integration/posts-api-db.integration.test.ts
 *
 * 注意:
 * - このテストはDBへ書き込みます。実行するDBはローカル/検証用DBにしてください（本番DBでは実行禁止）。
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    }),
  },
}));

import { prisma } from "@/lib/db/prisma";

const shouldRun = process.env.RUN_DB_INTEGRATION_TESTS === "true";
const describeIf = shouldRun ? describe : describe.skip;

function buildRequest(url: string, body?: unknown) {
  return {
    url,
    json: async () => body ?? null,
  } as unknown as Request;
}

describeIf("integration: /api/posts DB CRUD", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const authorId = `integration-user-${Date.now()}`;

  let postsRoute: typeof import("@/app/api/posts/route");
  let postByIdRoute: typeof import("@/app/api/posts/[id]/route");
  let softRoute: typeof import("@/app/api/posts/[id]/soft/route");
  let restoreRoute: typeof import("@/app/api/posts/[id]/restore/route");
  let hardRoute: typeof import("@/app/api/posts/[id]/hard/route");
  let emptyTrashRoute: typeof import("@/app/api/posts/empty-trash/route");

  beforeAll(async () => {
    // productionガードがあるので、開発環境相当で実行する
    process.env.NODE_ENV = "development";

    postsRoute = await import("@/app/api/posts/route");
    postByIdRoute = await import("@/app/api/posts/[id]/route");
    softRoute = await import("@/app/api/posts/[id]/soft/route");
    restoreRoute = await import("@/app/api/posts/[id]/restore/route");
    hardRoute = await import("@/app/api/posts/[id]/hard/route");
    emptyTrashRoute = await import("@/app/api/posts/empty-trash/route");

    // FKを満たすためにユーザーを用意（idのみ）
    await prisma.user.upsert({
      where: { id: authorId },
      update: {},
      create: { id: authorId },
    });
  });

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv;
    await prisma.$disconnect();
  });

  it("create -> list -> update -> softDelete -> restore -> hardDelete", async () => {
    // create
    const createdRes = await postsRoute.POST(
      buildRequest("http://localhost/api/posts", {
        authorId,
        contentJSON: '{"type":"doc"}',
        mode: "memo",
      }),
    );
    expect(createdRes.status).toBe(200);
    const created = createdRes.body as { postId: string; authorId: string };
    expect(created.authorId).toBe(authorId);
    expect(created.postId).toBeTruthy();

    const postId = created.postId;

    // list
    const listRes = await postsRoute.GET(
      buildRequest(
        `http://localhost/api/posts?authorId=${encodeURIComponent(authorId)}&status=active&limit=10&sortBy=createdAt&sortOrder=desc`,
      ),
    );
    expect(listRes.status).toBe(200);
    const listBody = listRes.body as { posts: Array<{ postId: string }> };
    expect(listBody.posts.some((p) => p.postId === postId)).toBe(true);

    // update
    const updatedRes = await postByIdRoute.PATCH(
      buildRequest(`http://localhost/api/posts/${postId}`, {
        contentJSON: '{"type":"doc","content":[]}',
        mode: "todo",
      }),
      { params: { id: postId } },
    );
    expect(updatedRes.status).toBe(200);

    // soft delete
    const softRes = await softRoute.POST(
      buildRequest(`http://localhost/api/posts/${postId}/soft`),
      { params: { id: postId } },
    );
    expect(softRes.status).toBe(200);

    // restore
    const restoreRes = await restoreRoute.POST(
      buildRequest(`http://localhost/api/posts/${postId}/restore`),
      { params: { id: postId } },
    );
    expect(restoreRes.status).toBe(200);

    // hard delete
    const hardRes = await hardRoute.DELETE(
      buildRequest(`http://localhost/api/posts/${postId}/hard`),
      { params: { id: postId } },
    );
    expect(hardRes.status).toBe(200);
  });

  it("empty-trash removes trashed posts for author", async () => {
    // create 2 posts
    const a = await postsRoute.POST(
      buildRequest("http://localhost/api/posts", {
        authorId,
        contentJSON: '{"type":"doc","content":[{"type":"paragraph"}]}',
        mode: "memo",
      }),
    );
    const b = await postsRoute.POST(
      buildRequest("http://localhost/api/posts", {
        authorId,
        contentJSON: '{"type":"doc","content":[{"type":"paragraph"}]}',
        mode: "todo",
      }),
    );
    const idA = (a.body as { postId: string }).postId;
    const idB = (b.body as { postId: string }).postId;

    // soft delete both
    await softRoute.POST(
      buildRequest(`http://localhost/api/posts/${idA}/soft`),
      {
        params: { id: idA },
      },
    );
    await softRoute.POST(
      buildRequest(`http://localhost/api/posts/${idB}/soft`),
      {
        params: { id: idB },
      },
    );

    // empty trash
    const emptyRes = await emptyTrashRoute.POST(
      buildRequest("http://localhost/api/posts/empty-trash", { authorId }),
    );
    expect(emptyRes.status).toBe(200);

    // list trashed should be empty (or not contain those ids)
    const trashedRes = await postsRoute.GET(
      buildRequest(
        `http://localhost/api/posts?authorId=${encodeURIComponent(authorId)}&status=trashed&limit=50&sortBy=createdAt&sortOrder=desc`,
      ),
    );
    expect(trashedRes.status).toBe(200);
    const trashed = trashedRes.body as { posts: Array<{ postId: string }> };
    expect(trashed.posts.some((p) => p.postId === idA)).toBe(false);
    expect(trashed.posts.some((p) => p.postId === idB)).toBe(false);
  });
});
