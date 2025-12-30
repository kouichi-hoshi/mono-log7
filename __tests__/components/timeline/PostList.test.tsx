import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { PostList } from "@/components/timeline/PostList";
import type { PostDTO } from "@/lib/postRepository";

// postRepositoryをモック
jest.mock("@/lib/postRepository", () => ({
  postRepository: {
    findMany: jest.fn(),
  },
}));

const mockPostRepository = require("@/lib/postRepository").postRepository as {
  findMany: jest.MockedFunction<
    typeof import("@/lib/postRepository").postRepository.findMany
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

  it("ローディング中はスピナー表示・投稿非表示", async () => {
    mockPostRepository.findMany.mockImplementation(
      () =>
        new Promise<PostDTO[]>((resolve) => {
          // 意図的に遅延させてローディング状態を確認
          setTimeout(() => resolve([]), 100);
        }),
    );

    renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} />);

    // ローディング中はスピナーが表示される
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();

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

    mockPostRepository.findMany.mockResolvedValue(mockPosts);

    renderWithQueryClient(<PostList authorId={TEST_AUTHOR_ID} />);

    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalledWith({
        authorId: TEST_AUTHOR_ID,
        limit: 10,
        sortBy: "updatedAt",
        sortOrder: "desc",
      });
    });

    // 10件の投稿が表示されるまで待つ
    await waitFor(() => {
      const postItems = screen.getAllByTestId("post-item");
      expect(postItems).toHaveLength(10);
    });

    // スピナーは非表示になる（フェードアウトを考慮して少し待つ）
    await waitFor(
      () => {
        expect(
          screen.queryByRole("status", { name: "Loading" }),
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
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
