import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthenticatedLanding } from "@/components/landing/AuthenticatedLanding";
import { UnauthenticatedLanding } from "@/components/landing/UnauthenticatedLanding";

// IntersectionObserverをモック
global.IntersectionObserver = class IntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

jest.mock("next/navigation");

const {
  __resetSearchParams,
  __setSearchParams,
  __setRouterMock,
  __resetRouterMock,
} = jest.requireMock("next/navigation") as {
  __resetSearchParams: () => void;
  __setSearchParams: (
    entries?: Record<string, string | undefined>,
  ) => URLSearchParams;
  __setRouterMock: (
    overrides?: Partial<{
      refresh: jest.Mock;
      push: jest.Mock;
      replace: jest.Mock;
    }>,
  ) => {
    refresh: jest.Mock;
    push: jest.Mock;
    replace: jest.Mock;
  };
  __resetRouterMock: () => {
    refresh: jest.Mock;
    push: jest.Mock;
    replace: jest.Mock;
  };
};

jest.mock("@/lib/postRepository", () => ({
  postRepository: {
    findMany: jest.fn().mockResolvedValue([]),
  },
}));

// sonnerをモック
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Home page components", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    __resetSearchParams();
    __resetRouterMock();
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

  test("UnauthenticatedLandingが正しく表示される", () => {
    render(<UnauthenticatedLanding />);

    expect(
      screen.getByRole("heading", { name: "Mono Log" }),
    ).toBeInTheDocument();
    // ログインボタンはヘッダーとメインにあるため、少なくとも1つ存在することを確認
    expect(
      screen.getAllByRole("button", { name: "ログイン" }).length,
    ).toBeGreaterThan(0);
  });

  test("AuthenticatedLandingが正しく表示される", () => {
    const mockSession = {
      userId: "stub-user-1",
      email: "stub@example.com",
      name: "スタブユーザー",
    };

    renderWithQueryClient(
      <AuthenticatedLanding session={mockSession} searchParams={{}} />,
    );

    // ログイン状態のヘッダーが表示される（ログインボタンは存在しない）
    expect(
      screen.queryByRole("button", { name: "ログイン" }),
    ).not.toBeInTheDocument();
    // アプリ名は表示される（md以上とmd未満の両方に存在するため、getAllByRoleを使用）
    const headings = screen.getAllByRole("heading", { name: "Mono Log" });
    expect(headings.length).toBeGreaterThan(0);
    // ユーザーアイコンボタンが存在する（セッション情報はポップオーバー内に表示される）
    const userButtons = screen.getAllByRole("button", {
      name: "ユーザーメニューを開く",
    });
    expect(userButtons.length).toBeGreaterThan(0);
  });

  test("AuthenticatedLandingにPostEditorが表示される", () => {
    const mockSession = {
      userId: "stub-user-1",
      email: "stub@example.com",
      name: "スタブユーザー",
    };

    renderWithQueryClient(
      <AuthenticatedLanding session={mockSession} searchParams={{}} />,
    );

    // PostEditorのモード選択チェックボックスが表示される
    expect(screen.getByRole("checkbox", { name: "メモ" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "ToDo" })).toBeInTheDocument();
    // 保存ボタンが表示される
    expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
  });

  describe("エラーシミュレーション（開発環境のみ）", () => {
    const mockSession = {
      userId: "stub-user-1",
      email: "stub@example.com",
      name: "スタブユーザー",
    };

    beforeEach(() => {
      // NODE_ENVをdevelopmentに設定（テスト環境では通常development）
      process.env.NODE_ENV = "development";
    });

    afterEach(() => {
      process.env.NODE_ENV = "test";
    });

    it("errorTest=authで認証エラートーストが表示され、URLから除去される", async () => {
      const { toast } = require("sonner");
      const routerMock = __setRouterMock();
      __setSearchParams({ errorTest: "auth" });

      renderWithQueryClient(
        <AuthenticatedLanding
          session={mockSession}
          searchParams={{ errorTest: "auth" }}
        />,
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("認証エラーが発生しました");
      });

      // URLからerrorTestが除去される
      await waitFor(() => {
        expect(routerMock.replace).toHaveBeenCalled();
      });
    });

    it("errorTest=authorizationで権限エラートーストが表示される", async () => {
      const { toast } = require("sonner");
      __setSearchParams({ errorTest: "authorization" });

      renderWithQueryClient(
        <AuthenticatedLanding
          session={mockSession}
          searchParams={{ errorTest: "authorization" }}
        />,
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("権限がありません");
      });
    });

    it("errorTest=notfoundでNot Foundエラートーストが表示される", async () => {
      const { toast } = require("sonner");
      __setSearchParams({ errorTest: "notfound" });

      renderWithQueryClient(
        <AuthenticatedLanding
          session={mockSession}
          searchParams={{ errorTest: "notfound" }}
        />,
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("対象が見つかりません");
      });
    });

    it("errorTest=validationでバリデーションエラートーストが表示される", async () => {
      const { toast } = require("sonner");
      __setSearchParams({ errorTest: "validation" });

      renderWithQueryClient(
        <AuthenticatedLanding
          session={mockSession}
          searchParams={{ errorTest: "validation" }}
        />,
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("入力内容に不備があります");
      });
    });

    it("errorTest=serverでサーバーエラートーストが表示される", async () => {
      const { toast } = require("sonner");
      __setSearchParams({ errorTest: "server" });

      renderWithQueryClient(
        <AuthenticatedLanding
          session={mockSession}
          searchParams={{ errorTest: "server" }}
        />,
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          "サーバーエラーが発生しました",
        );
      });
    });

    it("errorTest=genericで一般的なエラートーストが表示される", async () => {
      const { toast } = require("sonner");
      __setSearchParams({ errorTest: "generic" });

      renderWithQueryClient(
        <AuthenticatedLanding
          session={mockSession}
          searchParams={{ errorTest: "generic" }}
        />,
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("エラーが発生しました");
      });
    });

    it("errorTest=successで成功トーストが表示される", async () => {
      const { toast } = require("sonner");
      __setSearchParams({ errorTest: "success" });

      renderWithQueryClient(
        <AuthenticatedLanding
          session={mockSession}
          searchParams={{ errorTest: "success" }}
        />,
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith("操作が正常に完了しました");
      });
    });

    it("errorTestが未指定の場合はトーストが表示されない", async () => {
      const { toast } = require("sonner");
      __setSearchParams({});

      renderWithQueryClient(
        <AuthenticatedLanding session={mockSession} searchParams={{}} />,
      );

      // 少し待ってもトーストが呼ばれない
      await waitFor(
        () => {
          expect(toast.error).not.toHaveBeenCalled();
          expect(toast.success).not.toHaveBeenCalled();
        },
        { timeout: 100 },
      );
    });

    it("NODE_ENV=productionではエラーシミュレーションが無効化される", async () => {
      const { toast } = require("sonner");
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      __setSearchParams({ errorTest: "auth" });

      renderWithQueryClient(
        <AuthenticatedLanding
          session={mockSession}
          searchParams={{ errorTest: "auth" }}
        />,
      );

      // 少し待ってもトーストが呼ばれない
      await waitFor(
        () => {
          expect(toast.error).not.toHaveBeenCalled();
          expect(toast.success).not.toHaveBeenCalled();
        },
        { timeout: 100 },
      );

      // NODE_ENVを元に戻す
      process.env.NODE_ENV = originalEnv;
    });
  });
});
