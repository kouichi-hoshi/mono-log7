import { render, screen } from "@testing-library/react";
import { AuthenticatedLanding } from "@/components/landing/AuthenticatedLanding";
import { QueryProvider } from "@/components/providers/query-provider";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe("AuthenticatedLanding", () => {
  const mockSession = {
    userId: "stub-user-1",
    email: "stub@example.com",
    name: "スタブユーザー",
  };

  const renderWithProviders = (component: React.ReactElement) => {
    return render(<QueryProvider>{component}</QueryProvider>);
  };

  it("メイン領域にfixedヘッダー分のpadding-topと下部固定UI分のpadding-bottomが付与されている", () => {
    const { container } = renderWithProviders(
      <AuthenticatedLanding session={mockSession} />,
    );

    // main要素を取得
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();

    // fixedヘッダー分のpadding-top
    expect(main).toHaveClass("pt-[72px]");
    // md未満ではpb-*、md以上ではpb-0のクラスが付与されている
    expect(main).toHaveClass("pb-20");
    expect(main).toHaveClass("md:pb-0");
  });

  it("表示切替UIが1つだけ存在し、「ごみ箱を見る」リンクが含まれている", () => {
    renderWithProviders(<AuthenticatedLanding session={mockSession} />);

    // 表示切替UIが1つだけ存在する
    const viewSwitcher = screen.getByTestId("view-switcher");
    expect(viewSwitcher).toBeInTheDocument();

    // 「ごみ箱を見る」リンクが1つ存在する
    const trashLink = screen.getByRole("link", { name: "ごみ箱を見る" });
    expect(trashLink).toBeInTheDocument();
  });
});
