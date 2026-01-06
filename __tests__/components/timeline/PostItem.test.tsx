import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostItem } from "@/components/timeline/PostItem";
import type { PostDTO } from "@/lib/postRepository";

describe("PostItem", () => {
  const mockPost: PostDTO = {
    postId: "test-post-1",
    authorId: "test-user",
    contentJSON: JSON.stringify({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "テスト投稿の内容" }],
        },
      ],
    }),
    status: "active",
    mode: "memo",
    createdAt: new Date("2025-01-15T10:30:00"),
    updatedAt: new Date("2025-01-16T14:45:00"),
    deletedAt: null,
  };

  it("投稿の内容が正しく表示される", () => {
    render(<PostItem post={mockPost} />);

    // 投稿内容が表示される
    expect(screen.getByText("テスト投稿の内容")).toBeInTheDocument();
  });

  it("モードバッジが正しく表示される（メモ）", () => {
    render(<PostItem post={mockPost} />);

    // メモバッジが表示される
    expect(screen.getByText("メモ")).toBeInTheDocument();
  });

  it("モードバッジが正しく表示される（ToDo）", () => {
    const todoPost: PostDTO = {
      ...mockPost,
      mode: "todo",
    };
    render(<PostItem post={todoPost} />);

    // ToDoバッジが表示される
    expect(screen.getByText("ToDo")).toBeInTheDocument();
  });

  it("更新日時が正しくフォーマットされて表示される", () => {
    render(<PostItem post={mockPost} />);

    // 日時が表示される（フォーマット形式は実装に依存）
    const timeElement = screen.getByText(/2025/);
    expect(timeElement).toBeInTheDocument();
  });

  it("編集ボタンがクリックされるとonEditコールバックが呼ばれる", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();

    render(<PostItem post={mockPost} onEdit={onEdit} />);

    const editButton = screen.getByRole("button", { name: "編集" });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockPost);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("ゴミ箱ボタンがクリックされるとonDeleteコールバックが呼ばれる", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();

    render(<PostItem post={mockPost} onDelete={onDelete} />);

    const deleteButton = screen.getByRole("button", { name: "ごみ箱へ移動" });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockPost.postId);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("view=trashの場合は編集・削除ボタンが表示されない", () => {
    render(<PostItem post={mockPost} view="trash" />);

    // 編集ボタンが表示されない
    expect(
      screen.queryByRole("button", { name: "編集" }),
    ).not.toBeInTheDocument();
    // ゴミ箱ボタンが表示されない
    expect(
      screen.queryByRole("button", { name: "ごみ箱へ移動" }),
    ).not.toBeInTheDocument();
  });
});
