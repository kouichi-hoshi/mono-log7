/**
 * @jest-environment node
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    }),
  },
}));

jest.mock("@/lib/postRepository/prismaPostsRepository", () => ({
  prismaPostsRepository: {
    findMany: jest.fn(async () => ({ posts: [], nextCursor: undefined })),
  },
}));

jest.mock("@/lib/routing/guardProductionPostsApi", () => ({
  guardProductionPostsApi: jest.fn(() => undefined),
}));

import { prismaPostsRepository } from "@/lib/postRepository/prismaPostsRepository";

function buildRequest(url: string) {
  return { url } as Request;
}

describe("GET /api/posts cursor validation", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeAll(() => {
    process.env.NODE_ENV = "development";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ignores invalid cursor (bad base64)", async () => {
    const { GET } = await import("@/app/api/posts/route");
    await GET(buildRequest("http://localhost/api/posts?cursor=%%%"));
    expect(prismaPostsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: undefined }),
    );
  });

  it("ignores cursor with invalid date", async () => {
    const payload = Buffer.from(
      JSON.stringify({ sortValue: "x", postId: "p1" }),
      "utf-8",
    ).toString("base64");
    const { GET } = await import("@/app/api/posts/route");
    await GET(buildRequest(`http://localhost/api/posts?cursor=${payload}`));
    expect(prismaPostsRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: undefined }),
    );
  });
});
