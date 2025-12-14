import { render, screen } from "@testing-library/react";

import Home from "@/app/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe("Home page", () => {
  test("未ログイン画面（UnauthenticatedLanding）が表示される", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "Mono Log" }),
    ).toBeInTheDocument();
    // ログインボタンはヘッダーとメインにあるため、少なくとも1つ存在することを確認
    expect(
      screen.getAllByRole("button", { name: "ログイン" }).length,
    ).toBeGreaterThan(0);
  });
});
