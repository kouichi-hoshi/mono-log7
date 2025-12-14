import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { UiPlayground } from "@/components/dev/UiPlayground";

describe("UiPlayground", () => {
  test("Dialogのトリガーボタンで内容が表示される", async () => {
    const user = userEvent.setup();

    render(<UiPlayground />);

    await user.click(screen.getByRole("button", { name: "Dialogを開く" }));

    expect(
      await screen.findByRole("heading", { name: "Dialog の確認" }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("ここにコンテンツが入ります。"),
    ).toBeInTheDocument();
  });
});
