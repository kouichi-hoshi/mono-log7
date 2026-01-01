import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { AuthenticatedLanding } from "@/components/landing/AuthenticatedLanding";
import { UnauthenticatedLanding } from "@/components/landing/UnauthenticatedLanding";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("@/lib/postRepository", () => ({
  postRepository: {
    findMany: jest.fn().mockResolvedValue([]),
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

    renderWithQueryClient(<AuthenticatedLanding session={mockSession} />);

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
});
