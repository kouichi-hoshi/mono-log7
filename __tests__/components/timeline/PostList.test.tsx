import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostList } from "@/components/timeline/PostList";
import type { PostDTO } from "@/lib/postRepository";

// IntersectionObserverをモック
global.IntersectionObserver = class IntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// postRepositoryをモック
jest.mock("@/lib/postRepository", () => ({
  postRepository: {
    findMany: jest.fn(),
    softDelete: jest.fn(),
  },
}));

// sonnerをモック
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockPostRepository = require("@/lib/postRepository").postRepository as {
  findMany: jest.MockedFunction<
    typeof import("@/lib/postRepository").postRepository.findMany
  >;
  softDelete: jest.MockedFunction<
    typeof import("@/lib/postRepository").postRepository.softDelete
  >;
};

describe("PostList", () => {
  let queryClient: QueryClient;
  const TEST_AUTHOR_ID = "test-author";

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>,
    );
  };

  it("ローディング中はSkeleton表示・投稿非表示", async () => {
    mockPostRepository.findMany.mockImplementation(
      () =>
        new Promise((resolve) => {
          // 意図的に遅延させてローディング状態を確認
          setTimeout(() => resolve({ posts: [], nextCursor: undefined }), 100);
        }),
    );

    const { container } = renderWithQueryClient(
      <PostList authorId={TEST_AUTHOR_ID} />,
    );

    // ローディング中はSkeletonが表示される（data-slot="skeleton"を持つ要素を確認）
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);

    // 投稿はまだ表示されない
    expect(screen.queryByTestId("post-item")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalled();
    });
  });

  it("取得成功時に10件を描画し、postRepository.findManyが正しい引数で呼ばれる", async () => {
    const mockPosts: PostDTO[] = Array.from({ length: 10 }, (_, i) => ({
      postId: `post-${i}`,
      authorId: "test-user",
      contentJSON: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: `投稿${i}` }],
          },
        ],
      }),
      status: "active",
      mode: i % 2 === 0 ? "memo" : "todo",
      createdAt: new Date(2025, 0, 1 + i),
      updatedAt: new Date(2025, 0, 1 + i),
      deletedAt: null,
    }));

    mockPostRepository.findMany.mockResolvedValue({
      posts: mockPosts,
      nextCursor: undefined,
    });

    const { container } = renderWithQueryClient(
      <PostList authorId={TEST_AUTHOR_ID} />,
    );

    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalledWith({
        authorId: TEST_AUTHOR_ID,
        limit: 10,
        sortBy: "updatedAt",
        sortOrder: "desc",
        status: "active",
        cursor: undefined,
      });
    });

    // モードタイトルが表示される（デフォルトは"すべて"）
    expect(screen.getByRole("heading", { name: "すべて" })).toBeInTheDocument();

    // 10件の投稿が表示されるまで待つ
    await waitFor(() => {
      const postItems = screen.getAllByTestId("post-item");
      expect(postItems).toHaveLength(10);
    });

    // Skeletonは非表示になる
    await waitFor(() => {
      const skeletons = container.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBe(0);
    });
  });

  it("ゴミ箱ボタンクリックでpostRepository.softDeleteが呼ばれ、キャッシュが無効化される", async () => {
    const user = userEvent.setup();
    const mockPosts: PostDTO[] = [
      {
        postId: "post-1",
        authorId: TEST_AUTHOR_ID,
        contentJSON: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "テスト投稿" }],
            },
          ],
        }),
        status: "active",
        mode: "memo",
        createdAt: new Date(2025, 0, 1),
        updatedAt: new Date(2025, 0, 1),
        deletedAt: null,
      },
    ];

    mockPostRepository.findMany.mockResolvedValue({
      posts: mockPosts,
      nextCursor: undefined,
    });
    mockPostRepository.softDelete.mockResolvedValue(undefined);

    renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} />);

    // 投稿が表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByTestId("post-item")).toBeInTheDocument();
    });

    // ゴミ箱ボタンをクリック
    const deleteButton = screen.getByRole("button", { name: "ごみ箱へ移動" });
    await user.click(deleteButton);

    // softDeleteが呼ばれる
    await waitFor(() => {
      expect(mockPostRepository.softDelete).toHaveBeenCalledWith("post-1");
    });

    // invalidateQueriesにより再取得が走る
    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalledTimes(2);
    });
  });

  it("mode=memoでフィルタリングされ、postRepository.findManyが正しい引数で呼ばれる", async () => {
    const mockPosts: PostDTO[] = Array.from({ length: 5 }, (_, i) => ({
      postId: `post-${i}`,
      authorId: TEST_AUTHOR_ID,
      contentJSON: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: `メモ${i}` }],
          },
        ],
      }),
      status: "active",
      mode: "memo",
      createdAt: new Date(2025, 0, 1 + i),
      updatedAt: new Date(2025, 0, 1 + i),
      deletedAt: null,
    }));

    mockPostRepository.findMany.mockResolvedValue({
      posts: mockPosts,
      nextCursor: undefined,
    });

    renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} mode="memo" />);

    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalledWith({
        authorId: TEST_AUTHOR_ID,
        limit: 10,
        sortBy: "updatedAt",
        sortOrder: "desc",
        mode: "memo",
        status: "active",
        cursor: undefined,
      });
    });

    // モードタイトルが"メモ"になる
    expect(screen.getByRole("heading", { name: "メモ" })).toBeInTheDocument();
  });

  it("view=trashでゴミ箱ビューが表示され、postRepository.findManyが正しい引数で呼ばれる", async () => {
    const mockPosts: PostDTO[] = Array.from({ length: 3 }, (_, i) => ({
      postId: `post-${i}`,
      authorId: TEST_AUTHOR_ID,
      contentJSON: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: `削除済み${i}` }],
          },
        ],
      }),
      status: "trashed",
      mode: "memo",
      createdAt: new Date(2025, 0, 1 + i),
      updatedAt: new Date(2025, 0, 1 + i),
      deletedAt: new Date(2025, 0, 1 + i),
    }));

    mockPostRepository.findMany.mockResolvedValue({
      posts: mockPosts,
      nextCursor: undefined,
    });

    renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} view="trash" />);

    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalledWith({
        authorId: TEST_AUTHOR_ID,
        limit: 10,
        sortBy: "updatedAt",
        sortOrder: "desc",
        status: "trashed",
        cursor: undefined,
      });
    });

    // モードタイトルが"ごみ箱"になる
    expect(screen.getByRole("heading", { name: "ごみ箱" })).toBeInTheDocument();
  });

  it("エラー時にエラーメッセージを表示し、再試行ボタンがrenderされる", async () => {
    mockPostRepository.findMany.mockRejectedValue(
      new Error("投稿を読み込めませんでした"),
    );

    renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} />);

    await waitFor(() => {
      expect(
        screen.getByText(/投稿を読み込めませんでした/i),
      ).toBeInTheDocument();
    });

    // 再試行ボタンが表示される
    const retryButton = screen.getByRole("button", { name: /再試行/i });
    expect(retryButton).toBeInTheDocument();

    // 再試行ボタンをクリックすると再取得される
    retryButton.click();

    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalledTimes(2);
    });
  });
});
