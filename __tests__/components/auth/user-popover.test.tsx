import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { UserPopover } from "@/components/auth/UserPopover";
import * as authClient from "@/lib/authAdapter/client";

jest.mock("@/lib/authAdapter/client");

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("UserPopover", () => {
  const mockRefresh = jest.fn();
  const mockPush = jest.fn();
  const mockSession = {
    userId: "stub-user-1",
    email: "stub@example.com",
    name: "スタブユーザー",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
      push: mockPush,
      replace: jest.fn(),
    });
  });

  it("トリガーボタンクリックでポップオーバーが開く", async () => {
    const user = userEvent.setup();
    render(
      <UserPopover session={mockSession}>
        <button type="button">ユーザーアイコン</button>
      </UserPopover>,
    );

    const trigger = screen.getByRole("button", { name: "ユーザーアイコン" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("ユーザー名")).toBeInTheDocument();
      expect(screen.getByText("スタブユーザー")).toBeInTheDocument();
    });
  });

  it("外側クリックでポップオーバーが閉じる", async () => {
    const user = userEvent.setup();
    render(
      <UserPopover session={mockSession}>
        <button type="button">ユーザーアイコン</button>
      </UserPopover>,
    );

    const trigger = screen.getByRole("button", { name: "ユーザーアイコン" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("ユーザー名")).toBeInTheDocument();
    });

    // 外側をクリック
    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText("ユーザー名")).not.toBeInTheDocument();
    });
  });

  it("Escキーでポップオーバーが閉じる", async () => {
    const user = userEvent.setup();
    render(
      <UserPopover session={mockSession}>
        <button type="button">ユーザーアイコン</button>
      </UserPopover>,
    );

    const trigger = screen.getByRole("button", { name: "ユーザーアイコン" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("ユーザー名")).toBeInTheDocument();
    });

    // Escキーを押す
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("ユーザー名")).not.toBeInTheDocument();
    });
  });

  it("ログアウトボタン押下でauthAdapter.signOutが呼ばれ、router.refreshが実行される", async () => {
    const user = userEvent.setup();
    (authClient.signOut as jest.Mock).mockResolvedValue(undefined);

    render(
      <UserPopover session={mockSession}>
        <button type="button">ユーザーアイコン</button>
      </UserPopover>,
    );

    const trigger = screen.getByRole("button", { name: "ユーザーアイコン" });
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("ユーザー名")).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole("button", { name: "ログアウト" });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(authClient.signOut).toHaveBeenCalledTimes(1);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
