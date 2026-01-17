import { render, screen } from "@testing-library/react";
import { ViewSwitcher } from "@/components/layout/ViewSwitcher";

jest.mock("next/navigation");

const { __setSearchParams, __resetSearchParams } = jest.requireMock(
  "next/navigation",
) as {
  __setSearchParams: (
    entries?: Record<string, string | undefined>,
  ) => URLSearchParams;
  __resetSearchParams: () => URLSearchParams;
};

describe("ViewSwitcher", () => {
  beforeEach(() => {
    __resetSearchParams();
  });

  it("すべて/メモ/ToDoボタンが表示される", () => {
    render(<ViewSwitcher />);

    expect(screen.getByRole("link", { name: "すべて" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "メモ" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ToDo" })).toBeInTheDocument();
  });

  it("mode=allのとき「すべて」ボタンがsecondary variantになる", () => {
    __setSearchParams({ mode: "all" });
    render(<ViewSwitcher />);

    const allLink = screen.getByRole("link", { name: "すべて" });
    // asChildによりLink要素にクラスが適用される
    expect(allLink).toHaveClass("bg-secondary");
  });

  it("mode=memoのとき「メモ」ボタンがsecondary variantになる", () => {
    __setSearchParams({ mode: "memo" });
    render(<ViewSwitcher />);

    const memoLink = screen.getByRole("link", { name: "メモ" });
    // asChildによりLink要素にクラスが適用される
    expect(memoLink).toHaveClass("bg-secondary");
  });

  it("mode=todoのとき「ToDo」ボタンがsecondary variantになる", () => {
    __setSearchParams({ mode: "todo" });
    render(<ViewSwitcher />);

    const todoLink = screen.getByRole("link", { name: "ToDo" });
    // asChildによりLink要素にクラスが適用される
    expect(todoLink).toHaveClass("bg-secondary");
  });

  it("アクティブでないボタンはghost variantになる", () => {
    __setSearchParams({ mode: "memo" });
    render(<ViewSwitcher />);

    const allLink = screen.getByRole("link", { name: "すべて" });
    const todoLink = screen.getByRole("link", { name: "ToDo" });

    // アクティブでないボタンはghost variant（bg-secondaryクラスがない）
    expect(allLink).not.toHaveClass("bg-secondary");
    expect(todoLink).not.toHaveClass("bg-secondary");
  });

  it("「すべて」ボタンのリンクにmode=allが含まれる", () => {
    __setSearchParams({ mode: "memo" });
    render(<ViewSwitcher />);

    const allLink = screen.getByRole("link", { name: "すべて" });
    expect(allLink).toHaveAttribute(
      "href",
      "/?mode=all&sortBy=updatedAt&sortOrder=desc",
    );
  });

  it("「メモ」ボタンのリンクにmode=memoが含まれる", () => {
    __setSearchParams({ mode: "all" });
    render(<ViewSwitcher />);

    const memoLink = screen.getByRole("link", { name: "メモ" });
    expect(memoLink).toHaveAttribute(
      "href",
      "/?mode=memo&sortBy=updatedAt&sortOrder=desc",
    );
  });

  it("「ToDo」ボタンのリンクにmode=todoが含まれる", () => {
    __setSearchParams({ mode: "all" });
    render(<ViewSwitcher />);

    const todoLink = screen.getByRole("link", { name: "ToDo" });
    expect(todoLink).toHaveAttribute(
      "href",
      "/?mode=todo&sortBy=updatedAt&sortOrder=desc",
    );
  });

  it("view=trashのときmodeボタンをクリックするとviewパラメータが削除される", () => {
    __setSearchParams({ mode: "memo", view: "trash" });
    render(<ViewSwitcher />);

    const allLink = screen.getByRole("link", { name: "すべて" });
    // view=trashが削除され、mode=allのみになる
    expect(allLink).toHaveAttribute(
      "href",
      "/?mode=all&sortBy=updatedAt&sortOrder=desc",
    );
  });

  it("既存のクエリパラメータ（sortBy/sortOrder）が保持される", () => {
    __setSearchParams({ mode: "all", sortBy: "createdAt", sortOrder: "asc" });
    render(<ViewSwitcher />);

    const memoLink = screen.getByRole("link", { name: "メモ" });
    // sortBy/sortOrderが保持される
    expect(memoLink).toHaveAttribute(
      "href",
      "/?mode=memo&sortBy=createdAt&sortOrder=asc",
    );
  });

  it("ごみ箱リンクにview=trashと削除順のデフォルトが付与される", () => {
    render(<ViewSwitcher />);

    const trashLink = screen.getByRole("link", { name: "ごみ箱を見る" });
    const params = new URLSearchParams(
      (trashLink.getAttribute("href") ?? "").replace("/?", ""),
    );
    expect(params.get("view")).toBe("trash");
    expect(params.get("sortBy")).toBe("deletedAt");
    expect(params.get("sortOrder")).toBe("desc");
    expect(params.get("mode")).toBe("all");
  });

  it("ゴミ箱リンクでは既存のsortOrder=ascでもdescに上書きされる", () => {
    __setSearchParams({
      mode: "all",
      sortBy: "updatedAt",
      sortOrder: "asc",
    });
    render(<ViewSwitcher />);

    const trashLink = screen.getByRole("link", { name: "ごみ箱を見る" });
    const params = new URLSearchParams(
      (trashLink.getAttribute("href") ?? "").replace("/?", ""),
    );
    expect(params.get("sortOrder")).toBe("desc");
  });

  it("modeが未指定のときは「すべて」がアクティブになる", () => {
    __resetSearchParams();
    render(<ViewSwitcher />);

    const allLink = screen.getByRole("link", { name: "すべて" });
    // asChildによりLink要素にクラスが適用される
    expect(allLink).toHaveClass("bg-secondary");
  });
});
