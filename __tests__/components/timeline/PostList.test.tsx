import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostList } from "@/components/timeline/PostList";
import type { PostDTO } from "@/lib/postRepository";
import { createPostsQueryKey } from "@/lib/postsQueryKey";

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
    restore: jest.fn(),
    hardDelete: jest.fn(),
    emptyTrash: jest.fn(),
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
  restore: jest.MockedFunction<
    typeof import("@/lib/postRepository").postRepository.restore
  >;
  hardDelete: jest.MockedFunction<
    typeof import("@/lib/postRepository").postRepository.hardDelete
  >;
  emptyTrash: jest.MockedFunction<
    typeof import("@/lib/postRepository").postRepository.emptyTrash
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

  describe("ゴミ箱ビューでの選択チェックボックス", () => {
    it("view=trashで一括選択チェックボックスと「表示されている投稿を選択」ラベルが表示される", async () => {
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

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("post-item")).toHaveLength(3);
      });

      // 一括選択チェックボックスが表示される
      const selectAllCheckboxes = screen.getAllByRole("checkbox", {
        name: /表示されている投稿を選択/i,
      });
      expect(selectAllCheckboxes.length).toBeGreaterThan(0);

      // 「表示されている投稿を選択」ラベルが表示される
      expect(screen.getByText("表示されている投稿を選択")).toBeInTheDocument();
    });

    it("個別投稿のチェックボックスが表示され、クリックで選択状態が切り替わる", async () => {
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
                content: [{ type: "text", text: "削除済み投稿1" }],
              },
            ],
          }),
          status: "trashed",
          mode: "memo",
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
          deletedAt: new Date(2025, 0, 1),
        },
      ];

      mockPostRepository.findMany.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("post-item")).toBeInTheDocument();
      });

      // 個別投稿のチェックボックスを取得（aria-labelで識別）
      const checkboxes = screen.getAllByRole("checkbox");
      // 一括選択チェックボックスと個別チェックボックスがある
      expect(checkboxes.length).toBeGreaterThanOrEqual(2);

      // 個別チェックボックスをクリック（最初のチェックボックスは一括選択、2つ目以降が個別）
      const individualCheckbox = checkboxes.find((cb) =>
        cb.getAttribute("aria-label")?.includes("post-1"),
      );
      expect(individualCheckbox).toBeInTheDocument();

      if (individualCheckbox) {
        expect(individualCheckbox).not.toBeChecked();
        await user.click(individualCheckbox);
        await waitFor(() => {
          expect(individualCheckbox).toBeChecked();
        });

        // 「1件選択中」が表示される
        expect(screen.getByText("1件選択中")).toBeInTheDocument();
      }
    });

    it("一括選択チェックボックスで全投稿を選択/解除できる", async () => {
      const user = userEvent.setup();
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

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("post-item")).toHaveLength(3);
      });

      // 一括選択チェックボックスを取得
      const selectAllCheckbox = screen.getByRole("checkbox", {
        name: /表示されている投稿を選択/i,
      });
      expect(selectAllCheckbox).not.toBeChecked();

      // 一括選択をクリック
      await user.click(selectAllCheckbox);

      await waitFor(() => {
        expect(selectAllCheckbox).toBeChecked();
      });

      // 「3件選択中」が表示される
      expect(screen.getByText("3件選択中")).toBeInTheDocument();

      // すべての個別チェックボックスが選択されている
      const allCheckboxes = screen.getAllByRole("checkbox");
      allCheckboxes.forEach((checkbox) => {
        if (checkbox !== selectAllCheckbox) {
          expect(checkbox).toBeChecked();
        }
      });

      // 再度クリックで解除
      await user.click(selectAllCheckbox);

      await waitFor(() => {
        expect(selectAllCheckbox).not.toBeChecked();
      });

      // 「表示されている投稿を選択」に戻る
      expect(screen.getByText("表示されている投稿を選択")).toBeInTheDocument();
    });

    it("通常ビュー（view=trashでない）では選択チェックボックスが表示されない", async () => {
      const mockPosts: PostDTO[] = [
        {
          postId: "post-1",
          authorId: TEST_AUTHOR_ID,
          contentJSON: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "通常投稿" }],
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

      renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} />);

      await waitFor(() => {
        expect(screen.getByTestId("post-item")).toBeInTheDocument();
      });

      // 一括選択チェックボックスが表示されない
      expect(
        screen.queryByRole("checkbox", { name: /表示されている投稿を選択/i }),
      ).not.toBeInTheDocument();

      // 「n件選択中」が表示されない
      expect(screen.queryByText(/\d+件選択中/)).not.toBeInTheDocument();
    });
  });

  describe("ゴミ箱ビューでの復元機能", () => {
    it("選択された投稿がある場合、復元ボタンが表示される", async () => {
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
                content: [{ type: "text", text: "削除済み投稿1" }],
              },
            ],
          }),
          status: "trashed",
          mode: "memo",
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
          deletedAt: new Date(2025, 0, 1),
        },
      ];

      mockPostRepository.findMany.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      mockPostRepository.restore.mockResolvedValue(undefined);

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("post-item")).toBeInTheDocument();
      });

      // 初期状態では復元ボタンが表示されない
      expect(
        screen.queryByRole("button", { name: /復元/i }),
      ).not.toBeInTheDocument();

      // チェックボックスをクリックして選択
      const checkboxes = screen.getAllByRole("checkbox");
      const individualCheckbox = checkboxes.find((cb) =>
        cb.getAttribute("aria-label")?.includes("post-1"),
      );
      if (individualCheckbox) {
        await user.click(individualCheckbox);
      }

      // 復元ボタンが表示される
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /復元/i }),
        ).toBeInTheDocument();
      });
    });

    it("復元ボタンクリックでpostRepository.restoreが呼ばれ、キャッシュが更新される", async () => {
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
                content: [{ type: "text", text: "削除済み投稿1" }],
              },
            ],
          }),
          status: "trashed",
          mode: "memo",
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
          deletedAt: new Date(2025, 0, 1),
        },
      ];

      mockPostRepository.findMany.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      mockPostRepository.restore.mockResolvedValue(undefined);

      const setQueryDataSpy = jest.spyOn(queryClient, "setQueryData");
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("post-item")).toBeInTheDocument();
      });

      // チェックボックスをクリックして選択
      const checkboxes = screen.getAllByRole("checkbox");
      const individualCheckbox = checkboxes.find((cb) =>
        cb.getAttribute("aria-label")?.includes("post-1"),
      );
      if (individualCheckbox) {
        await user.click(individualCheckbox);
      }

      // 復元ボタンをクリック
      const restoreButton = await screen.findByRole("button", {
        name: /復元/i,
      });
      await user.click(restoreButton);

      // restoreが呼ばれる
      await waitFor(() => {
        expect(mockPostRepository.restore).toHaveBeenCalledWith("post-1");
      });

      // キャッシュが更新される
      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalled();
        expect(invalidateQueriesSpy).toHaveBeenCalled();
      });

      setQueryDataSpy.mockRestore();
      invalidateQueriesSpy.mockRestore();
    });

    it("復元成功時に「投稿を復元しました」トーストが表示される", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockPosts: PostDTO[] = [
        {
          postId: "post-1",
          authorId: TEST_AUTHOR_ID,
          contentJSON: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "削除済み投稿1" }],
              },
            ],
          }),
          status: "trashed",
          mode: "memo",
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
          deletedAt: new Date(2025, 0, 1),
        },
      ];

      mockPostRepository.findMany.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      mockPostRepository.restore.mockResolvedValue(undefined);

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("post-item")).toBeInTheDocument();
      });

      // チェックボックスをクリックして選択
      const checkboxes = screen.getAllByRole("checkbox");
      const individualCheckbox = checkboxes.find((cb) =>
        cb.getAttribute("aria-label")?.includes("post-1"),
      );
      if (individualCheckbox) {
        await user.click(individualCheckbox);
      }

      // 復元ボタンをクリック
      const restoreButton = await screen.findByRole("button", {
        name: /復元/i,
      });
      await user.click(restoreButton);

      // トーストが表示される
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("投稿を復元しました");
      });
    });
  });

  describe("ゴミ箱ビューでの削除機能", () => {
    it("ゴミ箱ビューで削除ボタンクリックで確認モーダルが表示される", async () => {
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
                content: [{ type: "text", text: "削除済み投稿1" }],
              },
            ],
          }),
          status: "trashed",
          mode: "memo",
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
          deletedAt: new Date(2025, 0, 1),
        },
      ];

      mockPostRepository.findMany.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      mockPostRepository.hardDelete.mockResolvedValue(undefined);

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("post-item")).toBeInTheDocument();
      });

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole("button", { name: "完全に削除" });
      await user.click(deleteButton);

      // 確認モーダルが表示される
      await waitFor(() => {
        expect(
          screen.getByText("1件の投稿を完全に削除しますか？"),
        ).toBeInTheDocument();
        expect(
          screen.getByText("この操作は取り消せません"),
        ).toBeInTheDocument();
      });
    });

    it("確認モーダルでキャンセルボタンをクリックするとモーダルが閉じる", async () => {
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
                content: [{ type: "text", text: "削除済み投稿1" }],
              },
            ],
          }),
          status: "trashed",
          mode: "memo",
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
          deletedAt: new Date(2025, 0, 1),
        },
      ];

      mockPostRepository.findMany.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("post-item")).toBeInTheDocument();
      });

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole("button", { name: "完全に削除" });
      await user.click(deleteButton);

      // 確認モーダルが表示される
      await waitFor(() => {
        expect(
          screen.getByText("1件の投稿を完全に削除しますか？"),
        ).toBeInTheDocument();
      });

      // キャンセルボタンをクリック
      const cancelButton = screen.getByRole("button", { name: "キャンセル" });
      await user.click(cancelButton);

      // モーダルが閉じる
      await waitFor(() => {
        expect(
          screen.queryByText("1件の投稿を完全に削除しますか？"),
        ).not.toBeInTheDocument();
      });

      // hardDeleteが呼ばれない
      expect(mockPostRepository.hardDelete).not.toHaveBeenCalled();
    });

    it("確認モーダルで削除ボタンをクリックするとpostRepository.hardDeleteが呼ばれる", async () => {
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
                content: [{ type: "text", text: "削除済み投稿1" }],
              },
            ],
          }),
          status: "trashed",
          mode: "memo",
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
          deletedAt: new Date(2025, 0, 1),
        },
      ];

      mockPostRepository.findMany.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      mockPostRepository.hardDelete.mockResolvedValue(undefined);

      const setQueryDataSpy = jest.spyOn(queryClient, "setQueryData");

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("post-item")).toBeInTheDocument();
      });

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole("button", { name: "完全に削除" });
      await user.click(deleteButton);

      // 確認モーダルで削除ボタンをクリック
      const confirmDeleteButton = await screen.findByRole("button", {
        name: "削除",
      });
      await user.click(confirmDeleteButton);

      // hardDeleteが呼ばれる
      await waitFor(() => {
        expect(mockPostRepository.hardDelete).toHaveBeenCalledWith("post-1");
      });

      // キャッシュが更新される
      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalled();
      });

      setQueryDataSpy.mockRestore();
    });

    it("削除成功時に「投稿を削除しました」トーストが表示される", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
      const mockPosts: PostDTO[] = [
        {
          postId: "post-1",
          authorId: TEST_AUTHOR_ID,
          contentJSON: JSON.stringify({
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "削除済み投稿1" }],
              },
            ],
          }),
          status: "trashed",
          mode: "memo",
          createdAt: new Date(2025, 0, 1),
          updatedAt: new Date(2025, 0, 1),
          deletedAt: new Date(2025, 0, 1),
        },
      ];

      mockPostRepository.findMany.mockResolvedValue({
        posts: mockPosts,
        nextCursor: undefined,
      });
      mockPostRepository.hardDelete.mockResolvedValue(undefined);

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("post-item")).toBeInTheDocument();
      });

      // 削除ボタンをクリック
      const deleteButton = screen.getByRole("button", { name: "完全に削除" });
      await user.click(deleteButton);

      // 確認モーダルで削除ボタンをクリック
      const confirmDeleteButton = await screen.findByRole("button", {
        name: "削除",
      });
      await user.click(confirmDeleteButton);

      // トーストが表示される
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("投稿を削除しました");
      });
    });
  });

  describe("ゴミ箱を空にする機能", () => {
    it("ゴミ箱ビューで「ごみ箱を空にする」ボタンが表示される", async () => {
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

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("post-item")).toHaveLength(3);
      });

      // 「ごみ箱を空にする」ボタンが表示される
      expect(
        screen.getByRole("button", { name: "ごみ箱を空にする" }),
      ).toBeInTheDocument();
    });

    it("「ごみ箱を空にする」ボタンクリックで確認モーダルが表示される", async () => {
      const user = userEvent.setup();
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

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("post-item")).toHaveLength(3);
      });

      // 「ごみ箱を空にする」ボタンをクリック
      const emptyTrashButton = screen.getByRole("button", {
        name: "ごみ箱を空にする",
      });
      await user.click(emptyTrashButton);

      // 確認モーダルが表示される
      await waitFor(() => {
        expect(
          screen.getByText("ゴミ箱内のすべての投稿を完全に削除しますか？"),
        ).toBeInTheDocument();
        expect(
          screen.getByText("この操作は取り消せません"),
        ).toBeInTheDocument();
      });
    });

    it("確認モーダルで削除ボタンをクリックするとpostRepository.emptyTrashが呼ばれる", async () => {
      const user = userEvent.setup();
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
      mockPostRepository.emptyTrash.mockResolvedValue(undefined);

      const setQueryDataSpy = jest.spyOn(queryClient, "setQueryData");

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("post-item")).toHaveLength(3);
      });

      // 「ごみ箱を空にする」ボタンをクリック
      const emptyTrashButton = screen.getByRole("button", {
        name: "ごみ箱を空にする",
      });
      await user.click(emptyTrashButton);

      // 確認モーダルで削除ボタンをクリック
      const confirmDeleteButton = await screen.findByRole("button", {
        name: "削除",
      });
      await user.click(confirmDeleteButton);

      // emptyTrashが呼ばれる
      await waitFor(() => {
        expect(mockPostRepository.emptyTrash).toHaveBeenCalledWith(
          TEST_AUTHOR_ID,
        );
      });

      // キャッシュが更新される
      await waitFor(() => {
        expect(setQueryDataSpy).toHaveBeenCalled();
      });

      setQueryDataSpy.mockRestore();
    });

    it("削除成功時に「投稿を削除しました」トーストが表示される", async () => {
      const user = userEvent.setup();
      const { toast } = require("sonner");
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
      mockPostRepository.emptyTrash.mockResolvedValue(undefined);

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("post-item")).toHaveLength(3);
      });

      // 「ごみ箱を空にする」ボタンをクリック
      const emptyTrashButton = screen.getByRole("button", {
        name: "ごみ箱を空にする",
      });
      await user.click(emptyTrashButton);

      // 確認モーダルで削除ボタンをクリック
      const confirmDeleteButton = await screen.findByRole("button", {
        name: "削除",
      });
      await user.click(confirmDeleteButton);

      // トーストが表示される
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("投稿を削除しました");
      });
    });

    it("ゴミ箱を空にすると異なるソートのキャッシュも空になる", async () => {
      const user = userEvent.setup();
      const mockPosts: PostDTO[] = Array.from({ length: 2 }, (_, i) => ({
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
      mockPostRepository.emptyTrash.mockResolvedValue(undefined);

      const otherTrashKey = createPostsQueryKey({
        authorId: TEST_AUTHOR_ID,
        view: "trash",
        sortBy: "createdAt",
        sortOrder: "asc",
      });

      renderWithQueryClient(
        <PostList authorId={TEST_AUTHOR_ID} view="trash" />,
      );

      await waitFor(() => {
        expect(screen.getAllByTestId("post-item")).toHaveLength(2);
      });

      // 別ソートのゴミ箱キャッシュをセット
      queryClient.setQueryData(otherTrashKey, {
        pages: [
          {
            posts: mockPosts,
            nextCursor: undefined,
          },
        ],
        pageParams: [undefined],
      });

      const emptyTrashButton = screen.getByRole("button", {
        name: "ごみ箱を空にする",
      });
      await user.click(emptyTrashButton);

      const confirmDeleteButton = await screen.findByRole("button", {
        name: "削除",
      });
      await user.click(confirmDeleteButton);

      await waitFor(() => {
        const otherCache = queryClient.getQueryData(otherTrashKey) as
          | { pages: Array<{ posts: PostDTO[] }> }
          | undefined;
        expect(otherCache?.pages?.[0]?.posts).toHaveLength(0);
      });
    });
  });
});
