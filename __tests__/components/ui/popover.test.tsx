import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

describe("Popover", () => {
  it("開閉動作が動作する", async () => {
    const user = userEvent.setup();
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Popoverを開く</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div>Popoverのコンテンツ</div>
        </PopoverContent>
      </Popover>,
    );

    // 初期状態では非表示
    expect(screen.queryByText("Popoverのコンテンツ")).not.toBeInTheDocument();

    // トリガーボタンをクリック
    const triggerButton = screen.getByRole("button", { name: "Popoverを開く" });
    await user.click(triggerButton);

    // Popoverが表示される
    expect(screen.getByText("Popoverのコンテンツ")).toBeInTheDocument();
  });

  it("外側クリックで閉じる", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Popoverを開く</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div>Popoverのコンテンツ</div>
          </PopoverContent>
        </Popover>
        <div data-testid="outside">外側</div>
      </div>,
    );

    const triggerButton = screen.getByRole("button", { name: "Popoverを開く" });
    await user.click(triggerButton);

    expect(screen.getByText("Popoverのコンテンツ")).toBeInTheDocument();

    // 外側をクリック
    const outside = screen.getByTestId("outside");
    await user.click(outside);

    // Popoverが閉じる
    expect(screen.queryByText("Popoverのコンテンツ")).not.toBeInTheDocument();
  });
});
