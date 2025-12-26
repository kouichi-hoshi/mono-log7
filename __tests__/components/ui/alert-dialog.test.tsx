import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

describe("AlertDialog", () => {
  it("モーダルが表示される", async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>開く</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タイトル</AlertDialogTitle>
            <AlertDialogDescription>説明文</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction>確定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    // 初期状態では非表示
    expect(screen.queryByText("タイトル")).not.toBeInTheDocument();

    // トリガーボタンをクリック
    const triggerButton = screen.getByRole("button", { name: "開く" });
    await user.click(triggerButton);

    // モーダルが表示される
    expect(screen.getByText("タイトル")).toBeInTheDocument();
    expect(screen.getByText("説明文")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "キャンセル" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "確定" })).toBeInTheDocument();
  });

  it("キャンセルボタンで閉じる", async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>開く</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タイトル</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction>確定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const triggerButton = screen.getByRole("button", { name: "開く" });
    await user.click(triggerButton);

    expect(screen.getByText("タイトル")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "キャンセル" });
    await user.click(cancelButton);

    // モーダルが閉じる
    expect(screen.queryByText("タイトル")).not.toBeInTheDocument();
  });

  it("確定ボタンで閉じる", async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>開く</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タイトル</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction>確定</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    const triggerButton = screen.getByRole("button", { name: "開く" });
    await user.click(triggerButton);

    expect(screen.getByText("タイトル")).toBeInTheDocument();

    const actionButton = screen.getByRole("button", { name: "確定" });
    await user.click(actionButton);

    // モーダルが閉じる
    expect(screen.queryByText("タイトル")).not.toBeInTheDocument();
  });
});
