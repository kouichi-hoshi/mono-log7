/**
 * 投稿リポジトリ
 * スタブ/本番の投稿CRUD処理を切り替える接続ポイント
 */
import { shouldUseStubPosts } from "@/lib/config/postRepositoryConfig";

// ドメインモデル型定義
export type PostMode = "memo" | "todo" | "diary";
export type PostStatus = "active" | "trashed";

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
  cursor?: string; // カーソルベースページング用（投稿ID）
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
}

export interface FindManyResult {
  posts: PostDTO[];
  nextCursor?: string; // 次のページがある場合のカーソル（最後の投稿ID）
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

  // ソート
  const sortBy = options.sortBy || "updatedAt";
  const sortOrder = options.sortOrder || "desc";
  filtered.sort((a, b) => {
    const aVal = a[sortBy].getTime();
    const bVal = b[sortBy].getTime();
    return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  });

  // カーソルベースページング
  let startIndex = 0;
  if (options.cursor) {
    const cursorIndex = filtered.findIndex((p) => p.postId === options.cursor);
    if (cursorIndex !== -1) {
      // カーソル以降の投稿を取得（カーソル自体は含めない）
      startIndex = cursorIndex + 1;
    } else {
      // カーソルが見つからない場合は空を返す
      return { posts: [] };
    }
  } else if (options.offset !== undefined) {
    // offset が指定されている場合は offset ベース
    startIndex = options.offset;
  }

  const limit = options.limit || 10;
  const paginated = filtered.slice(startIndex, startIndex + limit);

  // 次のページがあるかチェック
  const hasNextPage = startIndex + limit < filtered.length;
  const nextCursor = hasNextPage
    ? paginated[paginated.length - 1]?.postId
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
    // 本番実装はフェーズ2で実装
    throw new Error("本番投稿CRUDは未実装です");
  },

  /**
   * 投稿一覧取得
   */
  async findMany(options?: FindManyOptions): Promise<FindManyResult> {
    if (shouldUseStubPosts()) {
      return await stubFindMany(options);
    }
    // 本番実装はフェーズ2で実装
    throw new Error("本番投稿CRUDは未実装です");
  },

  /**
   * IDで投稿取得
   */
  async findById(postId: string): Promise<PostDTO | null> {
    if (shouldUseStubPosts()) {
      return await stubFindById(postId);
    }
    // 本番実装はフェーズ2で実装
    return null;
  },

  /**
   * 投稿更新
   */
  async update(postId: string, input: UpdatePostInput): Promise<PostDTO> {
    if (shouldUseStubPosts()) {
      return await stubUpdate(postId, input);
    }
    // 本番実装はフェーズ2で実装
    throw new Error("本番投稿CRUDは未実装です");
  },

  /**
   * ソフト削除（ゴミ箱に移動）
   */
  async softDelete(postId: string): Promise<void> {
    if (shouldUseStubPosts()) {
      return await stubSoftDelete(postId);
    }
    // 本番実装はフェーズ2で実装
    throw new Error("本番投稿CRUDは未実装です");
  },

  /**
   * 復元（ゴミ箱から戻す）
   */
  async restore(postId: string): Promise<void> {
    if (shouldUseStubPosts()) {
      return await stubRestore(postId);
    }
    // 本番実装はフェーズ2で実装
    throw new Error("本番投稿CRUDは未実装です");
  },

  /**
   * 完全削除
   */
  async hardDelete(postId: string): Promise<void> {
    if (shouldUseStubPosts()) {
      return await stubHardDelete(postId);
    }
    // 本番実装はフェーズ2で実装
    throw new Error("本番投稿CRUDは未実装です");
  },
};
