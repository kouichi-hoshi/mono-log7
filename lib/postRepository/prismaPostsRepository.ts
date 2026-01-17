import { prisma } from "@/lib/db/prisma";
import type {
  CreatePostInput,
  FindManyOptions,
  FindManyResult,
  PostDTO,
  UpdatePostInput,
} from "@/lib/postRepository";
import { assertPostStatusDeletedAtConsistency } from "@/lib/postRepository/consistency";

function mapToDTO(post: {
  postId: string;
  authorId: string;
  contentJSON: string;
  status: "active" | "trashed";
  mode: "memo" | "todo" | "diary";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): PostDTO {
  assertPostStatusDeletedAtConsistency({
    status: post.status,
    deletedAt: post.deletedAt,
    postId: post.postId,
  });
  return {
    postId: post.postId,
    authorId: post.authorId,
    contentJSON: post.contentJSON,
    status: post.status,
    mode: post.mode,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    deletedAt: post.deletedAt,
  };
}

async function updateTrashState(
  postId: string,
  trashed: boolean,
): Promise<void> {
  await prisma.post.update({
    where: { postId },
    data: {
      status: trashed ? "trashed" : "active",
      deletedAt: trashed ? new Date() : null,
    },
  });
}

export const prismaPostsRepository = {
  async create(input: CreatePostInput): Promise<PostDTO> {
    const created = await prisma.post.create({
      data: {
        authorId: input.authorId,
        contentJSON: input.contentJSON,
        status: "active",
        mode: input.mode,
      },
    });
    return mapToDTO(created);
  },

  async findMany(options: FindManyOptions = {}): Promise<FindManyResult> {
    const limit = options.limit ?? 10;
    const sortBy =
      (options.sortBy === "deletedAt" && options.status !== "trashed"
        ? undefined
        : options.sortBy) ??
      (options.status === "trashed" ? "deletedAt" : "updatedAt");
    const sortOrder = options.sortOrder ?? "desc";
    const cursor = options.cursor;

    const where = {
      ...(options.authorId && { authorId: options.authorId }),
      ...(options.mode && { mode: options.mode }),
      ...(options.status && { status: options.status }),
      ...(cursor
        ? {
            OR:
              sortOrder === "desc"
                ? [
                    {
                      [sortBy]: { lt: cursor.sortValue },
                    },
                    {
                      AND: [
                        { [sortBy]: cursor.sortValue },
                        { postId: { lt: cursor.postId } },
                      ],
                    },
                  ]
                : [
                    {
                      [sortBy]: { gt: cursor.sortValue },
                    },
                    {
                      AND: [
                        { [sortBy]: cursor.sortValue },
                        { postId: { gt: cursor.postId } },
                      ],
                    },
                  ],
          }
        : {}),
    };

    const posts = await prisma.post.findMany({
      where,
      orderBy: [
        {
          [sortBy]: sortOrder,
        },
        { postId: sortOrder },
      ],
      // cursor 条件指定時は where でページングしているため offset は無視
      ...(cursor
        ? {}
        : {
            skip: options.offset ?? 0,
          }),
      take: limit + 1, // 1件余分に取って nextCursor を判定
    });

    const hasNext = posts.length > limit;
    const sliced = posts.slice(0, limit);
    const last = sliced[sliced.length - 1];
    const lastSortValue = last?.[sortBy];

    return {
      posts: sliced.map(mapToDTO),
      nextCursor:
        hasNext && last && lastSortValue
          ? { sortValue: lastSortValue, postId: last.postId }
          : undefined,
    };
  },

  async findById(postId: string): Promise<PostDTO | null> {
    const found = await prisma.post.findUnique({
      where: { postId },
    });
    return found ? mapToDTO(found) : null;
  },

  async update(postId: string, input: UpdatePostInput): Promise<PostDTO> {
    const updated = await prisma.post.update({
      where: { postId },
      data: {
        ...(input.contentJSON !== undefined && {
          contentJSON: input.contentJSON,
        }),
        ...(input.mode !== undefined && { mode: input.mode }),
        updatedAt: new Date(),
      },
    });
    return mapToDTO(updated);
  },

  async softDelete(postId: string): Promise<void> {
    await updateTrashState(postId, true);
  },

  async restore(postId: string): Promise<void> {
    await updateTrashState(postId, false);
  },

  async hardDelete(postId: string): Promise<void> {
    await prisma.post.delete({
      where: { postId },
    });
  },

  async emptyTrash(authorId: string): Promise<void> {
    await prisma.post.deleteMany({
      where: { authorId, status: "trashed" },
    });
  },
};
