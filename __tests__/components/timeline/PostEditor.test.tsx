import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostEditor } from "@/components/timeline/PostEditor";
import type { PostDTO } from "@/lib/postRepository";

// postRepositoryをモック
jest.mock("@/lib/postRepository", () => ({
  postRepository: {
    create: jest.fn(),
  },
  PostMode: {},
}));

// sonnerをモック
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// tiptapのuseEditorとEditorContentをモック（jsdom環境での問題を回避）
jest.mock("@tiptap/react", () => {
  const actual = jest.requireActual("@tiptap/react");
  return {
    ...actual,
    useEditor: jest.fn(),
    EditorContent: ({
      editor,
    }: {
      editor: { getJSON: () => unknown; getText: () => string } | null;
    }) => {
      if (!editor) return null;
      return <div className="ProseMirror" data-testid="tiptap-editor" />;
    },
  };
});

const mockPostRepository = require("@/lib/postRepository").postRepository as {
  create: jest.MockedFunction<
    typeof import("@/lib/postRepository").postRepository.create
  >;
};

const mockToast = require("sonner").toast as {
  success: jest.MockedFunction<(message: string) => void>;
  error: jest.MockedFunction<(message: string) => void>;
};

const mockUseEditor = require("@tiptap/react").useEditor as jest.MockedFunction<
  typeof import("@tiptap/react").useEditor
>;

describe("PostEditor", () => {
  let queryClient: QueryClient;
  const TEST_AUTHOR_ID = "test-author";

  // モックエディタインスタンス
  const mockEditor = {
    getJSON: jest.fn(),
    getText: jest.fn(),
    commands: {
      clearContent: jest.fn().mockReturnValue(true),
      focus: jest.fn().mockReturnValue(true),
    },
  } as unknown as ReturnType<typeof mockUseEditor>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();

    // useEditorのモック設定
    mockUseEditor.mockReturnValue(mockEditor);
    mockEditor.getJSON.mockReturnValue({
      type: "doc",
      content: [],
    });
    mockEditor.getText.mockReturnValue("");
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

  it("tiptapエディタが表示される（P1-EDIT-01）", async () => {
    renderWithQueryClient(<PostEditor authorId={TEST_AUTHOR_ID} />);

    // エディタが表示されるまで待つ
    await waitFor(() => {
      const editor = document.querySelector(".ProseMirror");
      expect(editor).toBeInTheDocument();
    });

    // useEditorが呼ばれていることを確認
    expect(mockUseEditor).toHaveBeenCalled();
  });

  it("SSR時のhydrationずれ防止でimmediatelyRender=falseを指定する", () => {
    renderWithQueryClient(<PostEditor authorId={TEST_AUTHOR_ID} />);

    expect(mockUseEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        immediatelyRender: false,
      }),
    );
  });

  it("未入力アラートのタイマーはアンマウント時にクリーンアップされる", async () => {
    jest.useFakeTimers();
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    try {
      const { unmount } = renderWithQueryClient(
        <PostEditor authorId={TEST_AUTHOR_ID} />,
      );

      await waitFor(() => {
        const editor = document.querySelector(".ProseMirror");
        expect(editor).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: "保存" });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("内容を入力してください")).toBeInTheDocument();
      });

      unmount();

      act(() => {
        jest.runOnlyPendingTimers();
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
      consoleErrorSpy.mockRestore();
    }
  });

  it("モード切替の初期値はメモで、切替動作が正しい（P1-EDIT-02）", async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<PostEditor authorId={TEST_AUTHOR_ID} />);

    // 初期値はメモが選択されている
    const memoCheckbox = screen.getByRole("checkbox", { name: "メモ" });
    const todoCheckbox = screen.getByRole("checkbox", { name: "ToDo" });

    await waitFor(() => {
      expect(memoCheckbox).toBeChecked();
      expect(todoCheckbox).not.toBeChecked();
    });

    // ToDoに切り替え
    await user.click(todoCheckbox);

    await waitFor(() => {
      expect(todoCheckbox).toBeChecked();
      expect(memoCheckbox).not.toBeChecked();
    });
  });

  it("未入力で保存押下時にAlertを表示（P1-EDIT-03）", async () => {
    const user = userEvent.setup();
    mockEditor.getText.mockReturnValue(""); // 空文字列を返す

    renderWithQueryClient(<PostEditor authorId={TEST_AUTHOR_ID} />);

    // エディタが表示されるまで待つ
    await waitFor(() => {
      const editor = document.querySelector(".ProseMirror");
      expect(editor).toBeInTheDocument();
    });

    // 保存ボタンをクリック（未入力状態）
    const saveButton = screen.getByRole("button", { name: "保存" });
    await user.click(saveButton);

    // Alertが表示される
    await waitFor(() => {
      expect(screen.getByText("内容を入力してください")).toBeInTheDocument();
    });

    // postRepository.createは呼ばれない
    expect(mockPostRepository.create).not.toHaveBeenCalled();
  });

  it("正常保存でpostRepository.create/toast.success/エディタクリア・フォーカス呼び出し（P1-EDIT-04/05）", async () => {
    const user = userEvent.setup();
    const mockCreatedPost: PostDTO = {
      postId: "test-post-1",
      authorId: TEST_AUTHOR_ID,
      contentJSON:
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"テスト投稿"}]}]}',
      status: "active",
      mode: "memo",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockPostRepository.create.mockResolvedValue(mockCreatedPost);
    mockEditor.getText.mockReturnValue("テスト投稿"); // テキストが入力されている状態
    mockEditor.getJSON.mockReturnValue({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "テスト投稿" }],
        },
      ],
    });

    renderWithQueryClient(<PostEditor authorId={TEST_AUTHOR_ID} />);

    // エディタが表示されるまで待つ
    await waitFor(() => {
      const editor = document.querySelector(".ProseMirror");
      expect(editor).toBeInTheDocument();
    });

    // 保存ボタンをクリック
    const saveButton = screen.getByRole("button", { name: "保存" });
    await user.click(saveButton);

    // postRepository.createが呼ばれる
    await waitFor(() => {
      expect(mockPostRepository.create).toHaveBeenCalledWith({
        authorId: TEST_AUTHOR_ID,
        contentJSON: expect.stringContaining("テスト投稿"),
        mode: "memo",
      });
    });

    // toast.successが呼ばれる
    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith("保存しました");
    });

    // エディタがクリアされる
    expect(mockEditor.commands.clearContent).toHaveBeenCalled();
    // フォーカスが戻る
    expect(mockEditor.commands.focus).toHaveBeenCalledWith("end");
  });
});
