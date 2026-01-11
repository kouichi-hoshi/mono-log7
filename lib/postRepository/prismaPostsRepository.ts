import { prisma } from "@/lib/db/prisma";
import type {
  CreatePostInput,
  FindManyOptions,
  FindManyResult,
  PostDTO,
  UpdatePostInput,
} from "@/lib/postRepository";

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
    const sortBy = options.sortBy ?? "updatedAt";
    const sortOrder = options.sortOrder ?? "desc";

    const where = {
      ...(options.authorId && { authorId: options.authorId }),
      ...(options.mode && { mode: options.mode }),
      ...(options.status && { status: options.status }),
    };

    // cursor か offset のどちらかでページング。cursor 優先。
    const useCursor = Boolean(options.cursor);

    const posts = await prisma.post.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      ...(useCursor
        ? {
            cursor: { postId: options.cursor },
            skip: 1,
          }
        : {
            skip: options.offset ?? 0,
          }),
      take: limit + 1, // 1件余分に取って nextCursor を判定
    });

    const hasNext = posts.length > limit;
    const sliced = posts.slice(0, limit);

    return {
      posts: sliced.map(mapToDTO),
      nextCursor: hasNext ? sliced[sliced.length - 1]?.postId : undefined,
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
    await prisma.post.update({
      where: { postId },
      data: { status: "trashed", deletedAt: new Date() },
    });
  },

  async restore(postId: string): Promise<void> {
    await prisma.post.update({
      where: { postId },
      data: { status: "active", deletedAt: null },
    });
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
