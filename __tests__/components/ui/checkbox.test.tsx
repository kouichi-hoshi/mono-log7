import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "@/components/ui/checkbox";

describe("Checkbox", () => {
  it("チェック切替が動作する（controlled）", async () => {
    const user = userEvent.setup();
    let checked = false;
    const handleCheckedChange = (newChecked: boolean) => {
      checked = newChecked;
    };

    const { rerender } = render(
      <Checkbox
        checked={checked}
        onCheckedChange={handleCheckedChange}
        aria-label="テストチェックボックス"
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "テストチェックボックス",
    });
    expect(checkbox).not.toBeChecked();

    // チェック
    await user.click(checkbox);
    rerender(
      <Checkbox
        checked={checked}
        onCheckedChange={handleCheckedChange}
        aria-label="テストチェックボックス"
      />,
    );
    expect(checkbox).toBeChecked();

    // チェック解除
    await user.click(checkbox);
    rerender(
      <Checkbox
        checked={checked}
        onCheckedChange={handleCheckedChange}
        aria-label="テストチェックボックス"
      />,
    );
    expect(checkbox).not.toBeChecked();
  });

  it("uncontrolled で動作する", async () => {
    const user = userEvent.setup();
    render(
      <Checkbox defaultChecked={false} aria-label="テストチェックボックス" />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "テストチェックボックス",
    });
    expect(checkbox).not.toBeChecked();

    // チェック
    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    // チェック解除
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});
