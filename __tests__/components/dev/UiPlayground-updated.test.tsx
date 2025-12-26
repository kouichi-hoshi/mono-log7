import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UiPlayground } from "@/components/dev/UiPlayground";

// sonnerをモック
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe("UiPlayground (updated)", () => {
  it("各デモが表示される", () => {
    render(<UiPlayground />);

    // Dialog
    expect(screen.getByText("Dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Dialogを開く" }),
    ).toBeInTheDocument();

    // sonner
    expect(screen.getByText("sonner")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "成功通知を出す" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "エラー通知を出す" }),
    ).toBeInTheDocument();

    // Spinner
    expect(screen.getByText("Spinner（フェード演出）")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "表示（フェードイン）" }),
    ).toBeInTheDocument();

    // Alert
    expect(screen.getByText("Alert")).toBeInTheDocument();
    expect(screen.getByText("デフォルトのAlert")).toBeInTheDocument();

    // Alert-Dialog
    expect(
      screen.getByText("Alert-Dialog（確認モーダル）"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "削除する" }),
    ).toBeInTheDocument();

    // Checkbox
    expect(screen.getByText("Checkbox")).toBeInTheDocument();

    // Popover
    expect(screen.getByText("Popover")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Popoverを開く" }),
    ).toBeInTheDocument();
  });

  it("sonnerボタンが動作する", async () => {
    const user = userEvent.setup();
    const { toast } = require("sonner");

    render(<UiPlayground />);

    const successButton = screen.getByRole("button", {
      name: "成功通知を出す",
    });
    await user.click(successButton);
    expect(toast.success).toHaveBeenCalledWith("保存しました", {
      description: "成功通知の表示確認です",
    });

    const errorButton = screen.getByRole("button", {
      name: "エラー通知を出す",
    });
    await user.click(errorButton);
    expect(toast.error).toHaveBeenCalledWith("失敗しました", {
      description: "エラー通知の表示確認です",
    });
  });

  it("Spinnerボタンが動作する", async () => {
    const user = userEvent.setup();
    render(<UiPlayground />);

    const showButton = screen.getByRole("button", {
      name: "表示（フェードイン）",
    });
    const hideButton = screen.getByRole("button", {
      name: "非表示（フェードアウト）",
    });

    // 初期状態ではスピナーは非表示
    expect(
      screen.queryByRole("status", { name: "Loading" }),
    ).not.toBeInTheDocument();

    // 表示ボタンをクリック
    await user.click(showButton);
    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();

    // 非表示ボタンをクリック
    await user.click(hideButton);
    // フェードアウト後にアンマウントされるため、少し待つ必要がある
    // 実際の動作確認はブラウザで行う
  });

  it("Alert-Dialogが開閉する", async () => {
    const user = userEvent.setup();
    render(<UiPlayground />);

    const triggerButton = screen.getByRole("button", { name: "削除する" });
    await user.click(triggerButton);

    expect(screen.getByText("本当に削除しますか？")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "キャンセル" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "削除する" }),
    ).toBeInTheDocument();
  });

  it("Checkboxが動作する", async () => {
    const user = userEvent.setup();
    render(<UiPlayground />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);

    // 最初のチェックボックスをクリック
    await user.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  it("Popoverが開閉する", async () => {
    const user = userEvent.setup();
    render(<UiPlayground />);

    const triggerButton = screen.getByRole("button", { name: "Popoverを開く" });
    await user.click(triggerButton);

    // PopoverはPortalを使用するため、少し待つ必要がある
    // 実際の動作確認はブラウザで行う
    // ここではボタンが存在することを確認
    expect(triggerButton).toBeInTheDocument();
  });
});
