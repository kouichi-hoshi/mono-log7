import { render, screen } from "@testing-library/react";
import { useSearchParams } from "next/navigation";
import React from "react";
import { PostSortControls } from "@/components/timeline/PostSortControls";

jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

jest.mock("next/link", () => {
  // Button(asChild) expects a component that forwards refs
  return React.forwardRef<HTMLAnchorElement, React.ComponentProps<"a">>(
    function LinkMock(props, ref) {
      return <a ref={ref} {...props} />;
    },
  );
});

const mockUseSearchParams = useSearchParams as jest.MockedFunction<
  typeof useSearchParams
>;

const renderWithQuery = (query: string) => {
  mockUseSearchParams.mockReturnValue(new URLSearchParams(query));
  render(<PostSortControls />);
};

const getParamsFromLink = (name: RegExp | string) => {
  const link = screen.getByRole("link", { name });
  const href = link.getAttribute("href");
  expect(href).toBeTruthy();
  return new URLSearchParams(href?.replace(/^\/\?/, "") ?? "");
};

describe("PostSortControls", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("既存のmode/view/tagsを保持したまま昇順リンクを生成する", () => {
    renderWithQuery(
      "mode=memo&view=trash&tags=tagA&sortBy=createdAt&sortOrder=desc",
    );

    const params = getParamsFromLink(/昇順/);
    expect(params.get("mode")).toBe("memo");
    expect(params.get("view")).toBe("trash");
    expect(params.get("tags")).toBe("tagA");
    expect(params.get("sortBy")).toBe("createdAt");
    expect(params.get("sortOrder")).toBe("asc");
  });

  it("ソートリンク生成時に不足しているmode/sortBy/sortOrderを補完する", () => {
    renderWithQuery("");

    const params = getParamsFromLink(/投稿順/);
    expect(params.get("mode")).toBe("all");
    expect(params.get("sortBy")).toBe("createdAt");
    expect(params.get("sortOrder")).toBe("desc");
  });
});
