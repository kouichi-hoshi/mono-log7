import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthenticatedLanding } from "@/components/landing/AuthenticatedLanding";
import type { PostDTO } from "@/lib/postRepository";

// IntersectionObserverをモック
global.IntersectionObserver = class IntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

import { QueryProvider } from "@/components/providers/query-provider";

jest.mock("next/navigation");

// postRepositoryをモック
jest.mock("@/lib/postRepository", () => ({
  postRepository: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
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

// tiptapのuseEditorとEditorContentをモック
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
  findMany: jest.MockedFunction<
    typeof import("@/lib/postRepository").postRepository.findMany
  >;
  create: jest.MockedFunction<
    typeof import("@/lib/postRepository").postRepository.create
  >;
  update: jest.MockedFunction<
    typeof import("@/lib/postRepository").postRepository.update
  >;
};

const mockUseEditor = require("@tiptap/react").useEditor as jest.MockedFunction<
  typeof import("@tiptap/react").useEditor
>;

const { __resetSearchParams } = jest.requireMock("next/navigation") as {
  __resetSearchParams: () => void;
};

describe("AuthenticatedLanding", () => {
  const mockSession = {
    userId: "stub-user-1",
    email: "stub@example.com",
    name: "スタブユーザー",
  };

  // モックエディタインスタンス
  const mockEditor = {
    getJSON: jest.fn(),
    getText: jest.fn(),
    commands: {
      clearContent: jest.fn().mockReturnValue(true),
      focus: jest.fn().mockReturnValue(true),
      setContent: jest.fn().mockReturnValue(true),
    },
  } as unknown as ReturnType<typeof mockUseEditor>;

  const renderWithProviders = (component: React.ReactElement) => {
    return render(<QueryProvider>{component}</QueryProvider>);
  };

  beforeEach(() => {
    __resetSearchParams();
    jest.clearAllMocks();

    // useEditorのモック設定
    (mockUseEditor as jest.Mock).mockReturnValue(mockEditor);
    (mockEditor.getJSON as jest.Mock).mockReturnValue({
      type: "doc",
      content: [],
    });
    (mockEditor.getText as jest.Mock).mockReturnValue("");

    // postRepository.findManyのデフォルト実装
    mockPostRepository.findMany.mockResolvedValue({
      posts: [],
      nextCursor: undefined,
    });
  });

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

  it("searchParams.modeがPostListに正しく渡される（P1-FLT-01）", async () => {
    renderWithProviders(
      <AuthenticatedLanding
        session={mockSession}
        searchParams={{ mode: "memo" }}
      />,
    );

    // PostListがレンダリングされるまで待つ
    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalled();
    });

    // postRepository.findManyがmode=memoで呼ばれている
    expect(mockPostRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "memo",
      }),
    );
  });

  it("searchParams.mode=allのときPostListにmode=allが渡される（P1-FLT-01）", async () => {
    renderWithProviders(
      <AuthenticatedLanding
        session={mockSession}
        searchParams={{ mode: "all" }}
      />,
    );

    // PostListがレンダリングされるまで待つ
    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalled();
    });

    // mode=allのときはmodeパラメータが含まれない（すべて表示のため）
    expect(mockPostRepository.findMany).toHaveBeenCalledWith(
      expect.not.objectContaining({
        mode: expect.anything(),
      }),
    );
  });

  it("searchParams.mode=todoのときPostListにmode=todoが渡される（P1-FLT-01）", async () => {
    renderWithProviders(
      <AuthenticatedLanding
        session={mockSession}
        searchParams={{ mode: "todo" }}
      />,
    );

    // PostListがレンダリングされるまで待つ
    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalled();
    });

    // postRepository.findManyがmode=todoで呼ばれている
    expect(mockPostRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "todo",
      }),
    );
  });

  it("searchParams.view=trashのときPostListにview=trashが渡される（P1-TRASH-01）", async () => {
    renderWithProviders(
      <AuthenticatedLanding
        session={mockSession}
        searchParams={{ view: "trash" }}
      />,
    );

    // PostListがレンダリングされるまで待つ
    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalled();
    });

    // postRepository.findManyがstatus=trashedで呼ばれている（view=trashのとき）
    expect(mockPostRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "trashed",
      }),
    );

    // modeパラメータが含まれていない（view=trashのときはmodeを無視）
    expect(mockPostRepository.findMany).toHaveBeenCalledWith(
      expect.not.objectContaining({
        mode: expect.anything(),
      }),
    );
  });

  it("searchParams.view=trashとmodeが同時に指定されても、PostListはtrashedのみ取得する（P1-TRASH-01）", async () => {
    renderWithProviders(
      <AuthenticatedLanding
        session={mockSession}
        searchParams={{ view: "trash", mode: "memo" }}
      />,
    );

    // PostListがレンダリングされるまで待つ
    await waitFor(() => {
      expect(mockPostRepository.findMany).toHaveBeenCalled();
    });

    // postRepository.findManyがstatus=trashedで呼ばれている
    expect(mockPostRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "trashed",
      }),
    );

    // modeパラメータが含まれていない（view=trashのときはmodeを無視）
    expect(mockPostRepository.findMany).toHaveBeenCalledWith(
      expect.not.objectContaining({
        mode: expect.anything(),
      }),
    );
  });

  it("一覧の編集ボタンクリックでエディタが編集状態になり、キャンセルで新規状態に戻りモードが維持される（P1-EDIT-06/07）", async () => {
    const user = userEvent.setup();
    const mockPost: PostDTO = {
      postId: "test-post-1",
      authorId: mockSession.userId,
      contentJSON: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "テスト投稿" }],
          },
        ],
      }),
      status: "active",
      mode: "todo",
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockPostRepository.findMany.mockResolvedValue({
      posts: [mockPost],
      nextCursor: undefined,
    });

    renderWithProviders(<AuthenticatedLanding session={mockSession} />);

    // 投稿一覧が表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByTestId("post-item")).toBeInTheDocument();
    });

    // 編集ボタンをクリック
    const editButton = screen.getByRole("button", { name: "編集" });
    await user.click(editButton);

    // エディタが編集状態になる（更新ボタンとキャンセルボタンが表示される）
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "キャンセル" }),
      ).toBeInTheDocument();
    });

    // ToDoモードが選択されている（編集対象の投稿のモード）
    const todoCheckbox = screen.getByRole("checkbox", { name: "ToDo" });
    expect(todoCheckbox).toBeChecked();

    // モードをメモに変更
    const memoCheckbox = screen.getByRole("checkbox", { name: "メモ" });
    await user.click(memoCheckbox);

    await waitFor(() => {
      expect(memoCheckbox).toBeChecked();
      expect(todoCheckbox).not.toBeChecked();
    });

    // キャンセルボタンをクリック
    const cancelButton = screen.getByRole("button", { name: "キャンセル" });
    await user.click(cancelButton);

    // 新規状態に戻る（保存ボタンが表示され、キャンセルボタンが非表示になる）
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "保存" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "キャンセル" }),
      ).not.toBeInTheDocument();
    });

    // モードは直前の選択（メモ）が維持されている
    expect(memoCheckbox).toBeChecked();
    expect(todoCheckbox).not.toBeChecked();

    // エディタがクリアされている
    expect(mockEditor.commands.clearContent).toHaveBeenCalled();
    expect(mockEditor.commands.focus).toHaveBeenCalledWith("end");
  });
});
