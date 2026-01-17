/** @jest-environment node */
import { jest } from "@jest/globals";

jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    post: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockedPrisma = jest.requireMock("@/lib/db/prisma").prisma as {
  post: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    deleteMany: jest.Mock;
    create: jest.Mock;
  };
};

describe("prismaPostsRepository consistency guard", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = "development";
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("findManyが不整合レコードを受け取ったら例外を投げる", async () => {
    const { prismaPostsRepository } = await import(
      "@/lib/postRepository/prismaPostsRepository"
    );
    mockedPrisma.post.findMany.mockResolvedValueOnce([
      {
        postId: "p1",
        authorId: "a1",
        contentJSON: "{}",
        status: "active",
        mode: "memo",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(), // active なのに非null
      },
    ]);

    await expect(prismaPostsRepository.findMany()).rejects.toThrow(
      /inconsistent/i,
    );
  });

  it("findByIdが不整合レコードを受け取ったら例外を投げる", async () => {
    const { prismaPostsRepository } = await import(
      "@/lib/postRepository/prismaPostsRepository"
    );
    mockedPrisma.post.findUnique.mockResolvedValueOnce({
      postId: "p2",
      authorId: "a2",
      contentJSON: "{}",
      status: "active",
      mode: "memo",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: new Date(), // active なのに非null
    });

    await expect(prismaPostsRepository.findById("p2")).rejects.toThrow(
      /inconsistent/i,
    );
  });
});
