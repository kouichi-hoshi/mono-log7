import { act, render, screen } from "@testing-library/react";
import { SpinnerWithFade } from "@/components/ui/spinner-with-fade";

// jest.useFakeTimers() を使用してタイマーを制御
jest.useFakeTimers();

describe("SpinnerWithFade", () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  it("isLoading=true の時にスピナーがマウントされ、フェードインする", () => {
    const { rerender, container } = render(
      <SpinnerWithFade isLoading={false} />,
    );
    expect(
      screen.queryByRole("status", { name: "Loading" }),
    ).not.toBeInTheDocument();

    act(() => {
      rerender(<SpinnerWithFade isLoading={true} />);
    });

    const spinner = screen.getByRole("status", { name: "Loading" });
    expect(spinner).toBeInTheDocument();

    // ラッパーdivを取得
    const spinnerContainer = container.querySelector(
      "[data-spinner-container]",
    );
    expect(spinnerContainer).toBeInTheDocument();

    // 初期状態は opacity-0（フェードイン前）
    expect(spinnerContainer).toHaveClass("opacity-0");

    // 短い遅延後にフェードイン（opacity-100）
    act(() => {
      jest.advanceTimersByTime(20);
    });
    expect(spinnerContainer).toHaveClass("opacity-100");
  });

  it("isLoading=false の時にフェードアウトしてからアンマウントする", () => {
    const { rerender, container } = render(
      <SpinnerWithFade isLoading={true} />,
    );
    const spinnerContainer = container.querySelector(
      "[data-spinner-container]",
    );

    // フェードイン完了
    act(() => {
      jest.advanceTimersByTime(20);
    });
    expect(spinnerContainer).toHaveClass("opacity-100");

    // isLoading=false に変更
    act(() => {
      rerender(<SpinnerWithFade isLoading={false} />);
    });

    // フェードアウト開始（opacity-0）
    expect(spinnerContainer).toHaveClass("opacity-0");

    // 1秒経過後にアンマウント
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(
      screen.queryByRole("status", { name: "Loading" }),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector("[data-spinner-container]"),
    ).not.toBeInTheDocument();
  });

  // レイアウトシフトの検証は E2E テスト（Playwright）で行う予定
  // 詳細: docs/03. 設計書.md の「E2Eテスト」セクション参照
});
