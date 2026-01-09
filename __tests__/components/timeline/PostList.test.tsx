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

  it("ゴミ箱ボタンクリックでpostRepository.softDeleteが呼ばれ、キャッシュから該当投稿が削除される", async () => {
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
      {
        postId: "post-2",
        authorId: TEST_AUTHOR_ID,
        contentJSON: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "テスト投稿2" }],
            },
          ],
        }),
        status: "active",
        mode: "todo",
        createdAt: new Date(2025, 0, 2),
        updatedAt: new Date(2025, 0, 2),
        deletedAt: null,
      },
    ];

    mockPostRepository.findMany.mockResolvedValue({
      posts: mockPosts,
      nextCursor: undefined,
    });
    mockPostRepository.softDelete.mockResolvedValue(undefined);
    const setQueryDataSpy = jest.spyOn(queryClient, "setQueryData");

    renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} />);

    // 投稿が表示されるまで待つ
    await waitFor(() => {
      expect(screen.getAllByTestId("post-item")).toHaveLength(2);
    });

    // ゴミ箱ボタンをクリック（最初の投稿のボタン）
    const deleteButtons = screen.getAllByRole("button", {
      name: "ごみ箱へ移動",
    });
    await user.click(deleteButtons[0]);

    // softDeleteが呼ばれる
    await waitFor(() => {
      expect(mockPostRepository.softDelete).toHaveBeenCalledWith("post-1");
    });

    // setQueryDataが呼ばれ、キャッシュから該当投稿が削除される
    await waitFor(() => {
      expect(setQueryDataSpy).toHaveBeenCalled();
    });

    // setQueryDataの呼び出しを確認
    const setQueryDataCalls = setQueryDataSpy.mock.calls;
    expect(setQueryDataCalls.length).toBeGreaterThan(0);

    // キャッシュから該当投稿が削除されていることを確認
    // setQueryDataの第2引数（updater関数）を実行して結果を確認
    const firstCall = setQueryDataCalls[0];
    const updater = firstCall[1] as (
      old: { pages: Array<{ posts: PostDTO[] }> } | undefined,
    ) => { pages: Array<{ posts: PostDTO[] }> } | undefined;

    // 元のキャッシュデータをシミュレート
    const oldData = {
      pages: [
        {
          posts: mockPosts,
          nextCursor: undefined,
        },
      ],
    };

    const newData = updater(oldData);
    expect(newData).toBeDefined();
    expect(newData?.pages[0].posts).toHaveLength(1);
    expect(newData?.pages[0].posts[0].postId).toBe("post-2");

    setQueryDataSpy.mockRestore();
  });

  it("通常一覧でごみ箱に移動した投稿が、view=trashに切り替えると表示される", async () => {
    const user = userEvent.setup();
    const activePost: PostDTO = {
      postId: "post-1",
      authorId: TEST_AUTHOR_ID,
      contentJSON: JSON.stringify({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "ToDo本文" }] },
        ],
      }),
      status: "active",
      mode: "todo",
      createdAt: new Date(2025, 0, 2),
      updatedAt: new Date(2025, 0, 2),
      deletedAt: null,
    };
    const trashedPost: PostDTO = {
      ...activePost,
      status: "trashed",
      deletedAt: new Date(2025, 0, 3),
    };

    mockPostRepository.findMany.mockImplementation(async (options) => {
      if (options?.status === "trashed") {
        return {
          posts: [trashedPost],
          nextCursor: undefined,
        };
      }
      return {
        posts: [activePost],
        nextCursor: undefined,
      };
    });
    mockPostRepository.softDelete.mockResolvedValue(undefined);

    const { rerender } = renderWithQueryClient(
      <PostList authorId={TEST_AUTHOR_ID} mode="all" view={undefined} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("post-item")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: "ごみ箱へ移動" });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockPostRepository.softDelete).toHaveBeenCalledWith("post-1");
    });

    rerender(
      <QueryClientProvider client={queryClient}>
        <PostList authorId={TEST_AUTHOR_ID} mode="all" view="trash" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "ごみ箱" }),
      ).toBeInTheDocument();
      expect(screen.getByTestId("post-item")).toBeInTheDocument();
      expect(screen.getByText("ToDo本文")).toBeInTheDocument();
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

  it("view=trashではmodeが指定されていても無視してtrashedのみ取得する", async () => {
    const mockPosts: PostDTO[] = [
      {
        postId: "post-trashed",
        authorId: TEST_AUTHOR_ID,
        contentJSON: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "削除済みToDo" }],
            },
          ],
        }),
        status: "trashed",
        mode: "memo",
        createdAt: new Date(2025, 0, 1),
        updatedAt: new Date(2025, 0, 2),
        deletedAt: new Date(2025, 0, 3),
      },
    ];

    mockPostRepository.findMany.mockResolvedValue({
      posts: mockPosts,
      nextCursor: undefined,
    });

    renderWithQueryClient(
      <PostList authorId={TEST_AUTHOR_ID} mode="todo" view="trash" />,
    );

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

    expect(screen.getByRole("heading", { name: "ごみ箱" })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("post-item")).toBeInTheDocument();
    });
  });

  it("view=trashではmodeを変えても同一queryKeyのため再フェッチしない（キャッシュ分裂しない）", async () => {
    const mockPosts: PostDTO[] = [
      {
        postId: "post-trashed",
        authorId: TEST_AUTHOR_ID,
        contentJSON: JSON.stringify({
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "削除済み投稿" }],
            },
          ],
        }),
        status: "trashed",
        mode: "memo",
        createdAt: new Date(2025, 0, 1),
        updatedAt: new Date(2025, 0, 2),
        deletedAt: new Date(2025, 0, 3),
      },
    ];

    mockPostRepository.findMany.mockResolvedValue({
      posts: mockPosts,
      nextCursor: undefined,
    });

    const { rerender } = renderWithQueryClient(
      <PostList authorId={TEST_AUTHOR_ID} mode="memo" view="trash" />,
    );

    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalledTimes(1);
      expect(
        screen.getByRole("heading", { name: "ごみ箱" }),
      ).toBeInTheDocument();
    });

    // modeだけ変更（view=trashは維持）: queryKeyが同一なら再フェッチ不要
    rerender(
      <QueryClientProvider client={queryClient}>
        <PostList authorId={TEST_AUTHOR_ID} mode="todo" view="trash" />
      </QueryClientProvider>,
    );

    // 少し待っても追加呼び出しが発生しないこと
    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalledTimes(1);
    });
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

  it("ソートUIボタン群（更新順/投稿順・昇順/降順）が表示される", () => {
    renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} />);

    // PostSortControlsが表示される
    expect(screen.getByTestId("post-sort-controls")).toBeInTheDocument();

    // グループ1: 更新順/投稿順リンク（asChildでLinkとしてレンダリング）
    expect(screen.getByRole("link", { name: /更新順/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /投稿順/i })).toBeInTheDocument();

    // グループ2: 昇順/降順リンク
    expect(screen.getByRole("link", { name: /昇順/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /降順/i })).toBeInTheDocument();
  });

  it("sortBy/sortOrderの初期値がupdatedAt/descであること", async () => {
    renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} />);

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
  });

  it("ソートリンククリックでURLクエリが更新される", () => {
    renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} />);

    // 投稿順リンクのhrefを確認
    const createdSortLink = screen.getByRole("link", { name: /投稿順/i });
    expect(createdSortLink).toHaveAttribute(
      "href",
      expect.stringContaining("sortBy=createdAt"),
    );

    // 昇順リンクのhrefを確認
    const ascLink = screen.getByRole("link", { name: /昇順/i });
    expect(ascLink).toHaveAttribute(
      "href",
      expect.stringContaining("sortOrder=asc"),
    );
  });

  it("sortBy=createdAt, sortOrder=ascがfindManyに渡される", async () => {
    mockPostRepository.findMany.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });

    renderWithQueryClient(
      <PostList authorId={TEST_AUTHOR_ID} sortBy="createdAt" sortOrder="asc" />,
    );

    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalledWith({
        authorId: TEST_AUTHOR_ID,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "asc",
        status: "active",
        cursor: undefined,
      });
    });
  });

  it("view=trashでもsortBy/sortOrderがfindManyに渡される", async () => {
    mockPostRepository.findMany.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });

    renderWithQueryClient(
      <PostList
        authorId={TEST_AUTHOR_ID}
        view="trash"
        sortBy="createdAt"
        sortOrder="asc"
      />,
    );

    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalledWith({
        authorId: TEST_AUTHOR_ID,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "asc",
        status: "trashed",
        cursor: undefined,
      });
    });
  });
});
