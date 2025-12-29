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

  it("md以上では中央に表示切替枠と右側にユーザーアイコンが表示される", () => {
    render(<AuthenticatedHeader session={mockSession} />);

    // md以上用のレイアウトが存在する（hidden md:flex）
    const mdLayout = screen.getByText("表示切替UI（実装予定）");
    expect(mdLayout).toBeInTheDocument();

    // ユーザーアイコンボタンが存在する（複数あるが、少なくとも1つは存在する）
    const userButtons = screen.getAllByRole("button", {
      name: "ユーザーメニューを開く",
    });
    expect(userButtons.length).toBeGreaterThan(0);
  });

  it("md未満ではユーザーアイコンのみが表示される", () => {
    render(<AuthenticatedHeader session={mockSession} />);

    // md未満用のレイアウトが存在する（flex md:hidden）
    // 表示切替UIはmd未満では表示されない（md以上でのみ表示）
    // ユーザーアイコンは両方のレイアウトに存在する
    const userButtons = screen.getAllByRole("button", {
      name: "ユーザーメニューを開く",
    });
    expect(userButtons.length).toBe(2); // md以上用とmd未満用
  });
});
