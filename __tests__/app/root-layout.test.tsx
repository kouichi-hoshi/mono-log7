import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

/**
 * RootLayoutのスモークテスト。
 * ThemeProvider配下で `useTheme()` を利用するコンポーネント（Toasterなど）が
 * 正しくマウントされる構造を担保する。
 */
describe("RootLayout", () => {
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
});
