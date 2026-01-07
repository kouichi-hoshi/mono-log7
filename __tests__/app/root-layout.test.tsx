import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import RootLayout from "@/app/layout";

/**
 * RootLayoutのスモークテスト。
 * ThemeProvider配下で `useTheme()` を利用するコンポーネント（Toasterなど）が
 * 正しくマウントされる構造を担保する。
 */
describe("RootLayout", () => {
  afterEach(() => {
    // テスト間でトーストが残らないように掃除
    toast.dismiss();
  });

  test("ThemeProviderがアプリ全体をラップし、Toasterが正しく動作する", () => {
    // ThemeProviderが存在しない場合、useTheme()がエラーを投げます。
    // ToasterがThemeProvider外にある場合、useTheme()がエラーを投げます。
    // このテストは、両方が正しく配置されていることを確認します。
    render(
      <RootLayout>
        <div data-testid="test-children">Test Content</div>
      </RootLayout>,
    );

    // ThemeProviderが存在する場合、childrenがレンダリングされる
    expect(screen.getByTestId("test-children")).toBeInTheDocument();

    // ToasterがThemeProvider配下で正しく動作する場合、通知領域がレンダリングされる
    // SonnerのToasterはsection要素としてレンダリングされ、aria-labelで特定できる
    const toaster = screen.getByRole("region", {
      name: /notifications/i,
    });
    expect(toaster).toBeInTheDocument();
  });

  test("トーストはクリックで即座に閉じられる", async () => {
    const user = userEvent.setup();

    render(
      <RootLayout>
        <div data-testid="test-children">Test Content</div>
      </RootLayout>,
    );

    const region = screen.getByRole("region", { name: /notifications/i });

    toast.success("保存しました");

    // 表示されるまで待つ
    const title = await within(region).findByText("保存しました");

    // トースト自体をクリックすると消える（全トースト共通仕様）
    const toastItem = title.closest(
      "[data-sonner-toast]",
    ) as HTMLElement | null;
    expect(toastItem).toBeTruthy();
    await user.click(toastItem as HTMLElement);

    // 消えるまで待つ
    await waitFor(
      () => {
        expect(
          within(region).queryByText("保存しました"),
        ).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
