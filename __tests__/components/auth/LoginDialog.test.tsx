import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { authAdapter } from "@/lib/authAdapter";

// モック
jest.mock("@/lib/authAdapter");
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const mockSignIn = authAdapter.signIn as jest.MockedFunction<
  typeof authAdapter.signIn
>;

describe("LoginDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("開いた時に「Googleアカウントでログイン」ボタンが表示される", () => {
    render(<LoginDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByText("Googleアカウントでログイン")).toBeInTheDocument();
  });

  it("閉じた時にはボタンが表示されない", () => {
    render(<LoginDialog open={false} onOpenChange={jest.fn()} />);
    expect(
      screen.queryByText("Googleアカウントでログイン"),
    ).not.toBeInTheDocument();
  });

  it("「Googleアカウントでログイン」ボタンをクリックするとauthAdapter.signInが呼ばれる", async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(undefined);

    const onOpenChange = jest.fn();
    render(<LoginDialog open={true} onOpenChange={onOpenChange} />);

    const button = screen.getByText("Googleアカウントでログイン");
    await user.click(button);

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("×ボタンで閉じることができる", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    render(<LoginDialog open={true} onOpenChange={onOpenChange} />);

    // Dialogの閉じるボタン（Xアイコン）をクリック
    const closeButton = screen.getByRole("button", { name: /close/i });
    await user.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
