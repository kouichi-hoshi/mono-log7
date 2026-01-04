import { render, screen } from "@testing-library/react";
import { AuthenticatedHeader } from "@/components/layout/AuthenticatedHeader";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe("AuthenticatedHeader", () => {
  const mockSession = {
    userId: "stub-user-1",
    email: "stub@example.com",
    name: "スタブユーザー",
  };

  it("アプリ名が表示される", () => {
    render(<AuthenticatedHeader session={mockSession} />);

    // アプリ名はmd以上とmd未満の両方のレイアウトに存在する
    const headings = screen.getAllByRole("heading", { name: "Mono Log" });
    expect(headings.length).toBe(2); // md以上用とmd未満用
  });

  it("表示切替UIが1つだけ存在する", () => {
    render(<AuthenticatedHeader session={mockSession} />);

    // 表示切替UI（nav要素）が1つだけ存在する
    const viewSwitchers = screen.getAllByRole("navigation", {
      name: "表示切替",
    });
    expect(viewSwitchers.length).toBe(1);

    // data-testidで確認
    const viewSwitcher = screen.getByTestId("view-switcher");
    expect(viewSwitcher).toBeInTheDocument();
  });

  it("表示切替UIにレスポンシブ用のクラスが付与されている", () => {
    render(<AuthenticatedHeader session={mockSession} />);

    const viewSwitcher = screen.getByTestId("view-switcher");
    // md未満ではfixed bottom-0、md以上ではstaticのクラスが付与されている
    expect(viewSwitcher).toHaveClass("fixed", "bottom-0");
    expect(viewSwitcher).toHaveClass("md:static");

    // ユーザーアイコンは両方のレイアウトに存在する
    const userButtons = screen.getAllByRole("button", {
      name: "ユーザーメニューを開く",
    });
    expect(userButtons.length).toBe(2); // md以上用とmd未満用
  });
});
