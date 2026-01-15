/**
 * 投稿リポジトリ
 * スタブ/本番の投稿CRUD処理を切り替える接続ポイント
 */
import { shouldUseStubPosts } from "@/lib/config/postRepositoryConfig";

// ドメインモデル型定義
export type PostMode = "memo" | "todo" | "diary";
export type PostStatus = "active" | "trashed";
export interface FindManyCursor {
  sortValue: Date;
  postId: string;
}

export interface PostDTO {
  postId: string;
  authorId: string;
  contentJSON: string;
  status: PostStatus;
  mode: PostMode;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CreatePostInput {
  authorId: string;
  contentJSON: string;
  mode: PostMode;
}

export interface UpdatePostInput {
  contentJSON?: string;
  mode?: PostMode;
}

export interface FindManyOptions {
  authorId?: string;
  mode?: PostMode;
  status?: PostStatus;
  offset?: number;
  limit?: number;
  cursor?: FindManyCursor; // カーソルベースページング用（sortValue + postId）
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface FindManyResult {
  posts: PostDTO[];
  nextCursor?: FindManyCursor; // 次のページがある場合のカーソル
}

// スタブストア（メモリ上）
interface StubPost {
  postId: string;
  authorId: string;
  contentJSON: string;
  status: PostStatus;
  mode: PostMode;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

let stubPosts: StubPost[] = [];

/**
 * ID生成ユーティリティ（ULID風の簡易実装）
 */
function generatePostId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `post-${timestamp}-${random}`;
}

/**
 * 日時文字列をDateに変換
 */
function parseDate(dateStr: string): Date {
  // "2025/12/07 14:30" 形式をパース
  const [datePart, timePart] = dateStr.split(" ");
  const [year, month, day] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}

/**
 * スタブストアの初期化（samplePostsから変換）
 */
function initializeStubStore(): void {
  if (!shouldUseStubPosts()) {
    return;
  }

  // samplePostsを動的インポート（テスト時にモック可能にするため）
  // ただし、ここでは直接インポートして初期化
  const { samplePosts } = require("@/app/mock/samplePosts");

  stubPosts = samplePosts.map(
    (sample: {
      id: string;
      category: "メモ" | "ToDo";
      updatedAt: string;
      createdAt: string;
      body: string;
    }) => {
      const mode: PostMode = sample.category === "メモ" ? "memo" : "todo";
      return {
        postId: sample.id,
        authorId: "stub-user-1", // スタブユーザーID
        contentJSON: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: sample.body }],
            },
          ],
        }),
        status: "active" as PostStatus,
        mode,
        createdAt: parseDate(sample.createdAt),
        updatedAt: parseDate(sample.updatedAt),
        deletedAt: null,
      };
    },
  );
}

// 初期化実行（モジュール読み込み時に一度だけ実行）
if (shouldUseStubPosts()) {
  initializeStubStore();
}

/**
 * スタブCRUD: 投稿作成
 */
async function stubCreate(input: CreatePostInput): Promise<PostDTO> {
  if (!shouldUseStubPosts()) {
    throw new Error("スタブ投稿は無効です");
  }

  const now = new Date();
  const post: StubPost = {
    postId: generatePostId(),
    authorId: input.authorId,
    contentJSON: input.contentJSON,
    status: "active",
    mode: input.mode,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  stubPosts.push(post);
  return { ...post };
}

/**
 * スタブCRUD: 投稿一覧取得
 */
async function stubFindMany(
  options: FindManyOptions = {},
): Promise<FindManyResult> {
  if (!shouldUseStubPosts()) {
    return { posts: [] };
  }

  let filtered = [...stubPosts];

  const sortBy = options.sortBy || "updatedAt";
  const sortOrder = options.sortOrder || "desc";

  // フィルタリング
  if (options.authorId) {
    filtered = filtered.filter((p) => p.authorId === options.authorId);
  }
  if (options.mode) {
    filtered = filtered.filter((p) => p.mode === options.mode);
  }
  if (options.status) {
    filtered = filtered.filter((p) => p.status === options.status);
  }

  // ソート（postId をタイブレークに含める）
  filtered.sort((a, b) => {
    const aVal = a[sortBy].getTime();
    const bVal = b[sortBy].getTime();
    const primary = sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    if (primary !== 0) return primary;
    return sortOrder === "asc"
      ? a.postId.localeCompare(b.postId)
      : b.postId.localeCompare(a.postId);
  });

  // カーソルベースフィルタ
  if (options.cursor) {
    const cursor = options.cursor;
    filtered = filtered.filter((p) => {
      const cmp =
        sortOrder === "asc"
          ? p[sortBy].getTime() - cursor.sortValue.getTime()
          : cursor.sortValue.getTime() - p[sortBy].getTime();

      if (cmp === 0) {
        return sortOrder === "asc"
          ? p.postId > cursor.postId
          : p.postId < cursor.postId;
      }
      return cmp > 0;
    });
  }

  // ソート
  // cursor指定時はwhereで絞り込んだうえで先頭から取得する。offsetはcursor未指定時のみ反映。
  const startIndex =
    options.cursor !== undefined || options.offset === undefined
      ? 0
      : options.offset;

  const limit = options.limit || 10;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  // 次のページがあるかチェック
  const hasNextPage = startIndex + limit < filtered.length;
  const last = paginated[paginated.length - 1];
  const nextCursor =
    hasNextPage && last
      ? {
          sortValue: last[sortBy],
          postId: last.postId,
        }
      : undefined;

  return {
    posts: paginated.map((p) => ({ ...p })),
    nextCursor,
  };
}

/**
 * スタブCRUD: IDで投稿取得
 */
async function stubFindById(postId: string): Promise<PostDTO | null> {
  if (!shouldUseStubPosts()) {
    return null;
  }

  const post = stubPosts.find((p) => p.postId === postId);
  return post ? { ...post } : null;
}

/**
 * スタブCRUD: 投稿更新
 */
async function stubUpdate(
  postId: string,
  input: UpdatePostInput,
): Promise<PostDTO> {
  if (!shouldUseStubPosts()) {
    throw new Error("スタブ投稿は無効です");
  }

  const index = stubPosts.findIndex((p) => p.postId === postId);
  if (index === -1) {
    throw new Error(`投稿が見つかりません: ${postId}`);
  }

  const post = stubPosts[index];
  const updated: StubPost = {
    ...post,
    ...(input.contentJSON !== undefined && { contentJSON: input.contentJSON }),
    ...(input.mode !== undefined && { mode: input.mode }),
    updatedAt: new Date(),
  };

  stubPosts[index] = updated;
  return { ...updated };
}

/**
 * スタブCRUD: ソフト削除（ゴミ箱に移動）
 */
async function stubSoftDelete(postId: string): Promise<void> {
  if (!shouldUseStubPosts()) {
    throw new Error("スタブ投稿は無効です");
  }

  const index = stubPosts.findIndex((p) => p.postId === postId);
  if (index === -1) {
    throw new Error(`投稿が見つかりません: ${postId}`);
  }

  stubPosts[index] = {
    ...stubPosts[index],
    status: "trashed",
    deletedAt: new Date(),
  };
}

/**
 * スタブCRUD: 復元（ゴミ箱から戻す）
 */
async function stubRestore(postId: string): Promise<void> {
  if (!shouldUseStubPosts()) {
    throw new Error("スタブ投稿は無効です");
  }

  const index = stubPosts.findIndex((p) => p.postId === postId);
  if (index === -1) {
    throw new Error(`投稿が見つかりません: ${postId}`);
  }

  stubPosts[index] = {
    ...stubPosts[index],
    status: "active",
    deletedAt: null,
  };
}

/**
 * スタブCRUD: 完全削除
 */
async function stubHardDelete(postId: string): Promise<void> {
  if (!shouldUseStubPosts()) {
    throw new Error("スタブ投稿は無効です");
  }

  const index = stubPosts.findIndex((p) => p.postId === postId);
  if (index === -1) {
    throw new Error(`投稿が見つかりません: ${postId}`);
  }

  stubPosts.splice(index, 1);
}

/**
 * スタブCRUD: ゴミ箱を空にする（全trashed投稿を削除）
 */
async function stubEmptyTrash(authorId: string): Promise<void> {
  if (!shouldUseStubPosts()) {
    throw new Error("スタブ投稿は無効です");
  }

  // statusがtrashedの投稿をすべて削除
  stubPosts = stubPosts.filter(
    (p) => !(p.authorId === authorId && p.status === "trashed"),
  );
}

/**
 * テスト用: スタブストアリセット（開発環境のみ）
 */
export function resetStubStore(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("本番環境ではリセットできません");
  }
  stubPosts = [];
  if (shouldUseStubPosts()) {
    initializeStubStore();
  }
}

function encodeCursor(cursor: FindManyCursor): string {
  const payload = JSON.stringify({
    sortValue: cursor.sortValue.toISOString(),
    postId: cursor.postId,
  });
  if (typeof Buffer !== "undefined") {
    return Buffer.from(payload, "utf-8").toString("base64");
  }
  if (typeof btoa !== "undefined") {
    return btoa(payload);
  }
  throw new Error("Base64 encoding is not supported in this environment");
}

function decodeCursor(value: string): FindManyCursor | undefined {
  try {
    const json =
      typeof Buffer !== "undefined"
        ? Buffer.from(value, "base64").toString("utf-8")
        : typeof atob !== "undefined"
          ? atob(value)
          : null;
    if (!json) return undefined;
    const parsed = JSON.parse(json) as {
      sortValue?: string;
      postId?: string;
    };
    if (
      typeof parsed.sortValue !== "string" ||
      typeof parsed.postId !== "string"
    ) {
      return undefined;
    }
    const sortValue = new Date(parsed.sortValue);
    if (Number.isNaN(sortValue.getTime())) {
      return undefined;
    }
    return {
      sortValue,
      postId: parsed.postId,
    };
  } catch {
    return undefined;
  }
}

/**
 * 投稿リポジトリ（公開API）
 * 環境変数に応じてスタブ/本番を切り替える
 */
export const postRepository = {
  /**
   * 投稿作成
   */
  async create(input: CreatePostInput): Promise<PostDTO> {
    if (shouldUseStubPosts()) {
      return await stubCreate(input);
    }
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(`Failed to create post: ${res.statusText}`);
    }
    const data = (await res.json()) as ApiPostDTO;
    return deserializePost(data);
  },

  /**
   * 投稿一覧取得
   */
  async findMany(options?: FindManyOptions): Promise<FindManyResult> {
    if (shouldUseStubPosts()) {
      return await stubFindMany(options);
    }
    const params = new URLSearchParams();
    if (options?.authorId) params.set("authorId", options.authorId);
    if (options?.mode) params.set("mode", options.mode);
    if (options?.status) params.set("status", options.status);
    if (options?.offset !== undefined)
      params.set("offset", String(options.offset));
    if (options?.limit !== undefined)
      params.set("limit", String(options.limit));
    if (options?.cursor) params.set("cursor", encodeCursor(options.cursor));
    if (options?.sortBy) params.set("sortBy", options.sortBy);
    if (options?.sortOrder) params.set("sortOrder", options.sortOrder);

    const res = await fetch(`/api/posts?${params.toString()}`, {
      method: "GET",
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch posts: ${res.statusText}`);
    }
    const data = (await res.json()) as {
      posts: ApiPostDTO[];
      nextCursor?: string;
    };
    return {
      posts: data.posts.map(deserializePost),
      nextCursor: data.nextCursor ? decodeCursor(data.nextCursor) : undefined,
    };
  },

  /**
   * IDで投稿取得
   */
  async findById(postId: string): Promise<PostDTO | null> {
    if (shouldUseStubPosts()) {
      return await stubFindById(postId);
    }
    const res = await fetch(`/api/posts/${postId}`, { method: "GET" });
    if (res.status === 404) {
      return null;
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch post: ${res.statusText}`);
    }
    const data = (await res.json()) as ApiPostDTO;
    return deserializePost(data);
  },

  /**
   * 投稿更新
   */
  async update(postId: string, input: UpdatePostInput): Promise<PostDTO> {
    if (shouldUseStubPosts()) {
      return await stubUpdate(postId, input);
    }
    const res = await fetch(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(`Failed to update post: ${res.statusText}`);
    }
    const data = (await res.json()) as ApiPostDTO;
    return deserializePost(data);
  },

  /**
   * ソフト削除（ゴミ箱に移動）
   */
  async softDelete(postId: string): Promise<void> {
    if (shouldUseStubPosts()) {
      return await stubSoftDelete(postId);
    }
    const res = await fetch(`/api/posts/${postId}/soft`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(`Failed to soft delete post: ${res.statusText}`);
    }
  },

  /**
   * 復元（ゴミ箱から戻す）
   */
  async restore(postId: string): Promise<void> {
    if (shouldUseStubPosts()) {
      return await stubRestore(postId);
    }
    const res = await fetch(`/api/posts/${postId}/restore`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(`Failed to restore post: ${res.statusText}`);
    }
  },

  /**
   * 完全削除
   */
  async hardDelete(postId: string): Promise<void> {
    if (shouldUseStubPosts()) {
      return await stubHardDelete(postId);
    }
    const res = await fetch(`/api/posts/${postId}/hard`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`Failed to hard delete post: ${res.statusText}`);
    }
  },

  /**
   * ゴミ箱を空にする（全trashed投稿を削除）
   */
  async emptyTrash(authorId: string): Promise<void> {
    if (shouldUseStubPosts()) {
      return await stubEmptyTrash(authorId);
    }
    const res = await fetch(`/api/posts/empty-trash`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId }),
    });
    if (!res.ok) {
      throw new Error(`Failed to empty trash: ${res.statusText}`);
    }
  },
};

type ApiPostDTO = Omit<PostDTO, "createdAt" | "updatedAt" | "deletedAt"> & {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

function deserializePost(post: ApiPostDTO): PostDTO {
  return {
    ...post,
    createdAt: new Date(post.createdAt),
    updatedAt: new Date(post.updatedAt),
    deletedAt: post.deletedAt ? new Date(post.deletedAt) : null,
  };
}
