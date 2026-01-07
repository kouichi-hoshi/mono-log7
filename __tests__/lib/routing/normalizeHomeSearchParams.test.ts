import { normalizeHomeSearchParams } from "@/lib/routing/normalizeHomeSearchParams";

describe("normalizeHomeSearchParams", () => {
  it("modeが未指定の場合、mode=allが付与される", () => {
    const result = normalizeHomeSearchParams({});

    expect(result.normalized.get("mode")).toBe("all");
    expect(result.changed).toBe(true);
  });

  it("modeが不正値の場合、mode=allに正規化される", () => {
    const result = normalizeHomeSearchParams({ mode: "hoge" });

    expect(result.normalized.get("mode")).toBe("all");
    expect(result.changed).toBe(true);
  });

  it("mode=allの場合、そのまま維持される", () => {
    const result = normalizeHomeSearchParams({ mode: "all" });

    expect(result.normalized.get("mode")).toBe("all");
    expect(result.changed).toBe(false);
  });

  it("mode=memoの場合、そのまま維持される", () => {
    const result = normalizeHomeSearchParams({ mode: "memo" });

    expect(result.normalized.get("mode")).toBe("memo");
    expect(result.changed).toBe(false);
  });

  it("mode=todoの場合、そのまま維持される", () => {
    const result = normalizeHomeSearchParams({ mode: "todo" });

    expect(result.normalized.get("mode")).toBe("todo");
    expect(result.changed).toBe(false);
  });

  it("mode=diaryの場合、そのまま維持される", () => {
    const result = normalizeHomeSearchParams({ mode: "diary" });

    expect(result.normalized.get("mode")).toBe("diary");
    expect(result.changed).toBe(false);
  });

  it("view=trashの場合、そのまま維持される（ただしmode未指定のためchanged=true）", () => {
    const result = normalizeHomeSearchParams({ view: "trash" });

    expect(result.normalized.get("view")).toBe("trash");
    expect(result.normalized.get("mode")).toBe("all"); // modeが未指定なのでallが付与される
    expect(result.changed).toBe(true); // modeが付与されたためchanged=true
  });

  it("viewが不正値の場合、削除される", () => {
    const result = normalizeHomeSearchParams({ view: "hoge" });

    expect(result.normalized.get("view")).toBeNull();
    expect(result.changed).toBe(true);
  });

  it("modeとviewが両方正しい場合、両方維持される", () => {
    const result = normalizeHomeSearchParams({
      mode: "memo",
      view: "trash",
    });

    expect(result.normalized.get("mode")).toBe("memo");
    expect(result.normalized.get("view")).toBe("trash");
    expect(result.changed).toBe(false);
  });

  it("未知のクエリパラメータ（tags）は保持される", () => {
    const result = normalizeHomeSearchParams({
      mode: "all",
      tags: "tag1,tag2",
    });

    expect(result.normalized.get("mode")).toBe("all");
    expect(result.normalized.get("tags")).toBe("tag1,tag2");
    expect(result.changed).toBe(false);
  });

  it("未知のクエリパラメータ（errorTest）は保持される", () => {
    const result = normalizeHomeSearchParams({
      mode: "all",
      errorTest: "auth",
    });

    expect(result.normalized.get("mode")).toBe("all");
    expect(result.normalized.get("errorTest")).toBe("auth");
    expect(result.changed).toBe(false);
  });

  it("複数の未知クエリパラメータが保持される", () => {
    const result = normalizeHomeSearchParams({
      mode: "memo",
      tags: "tag1",
      errorTest: "server",
      custom: "value",
    });

    expect(result.normalized.get("mode")).toBe("memo");
    expect(result.normalized.get("tags")).toBe("tag1");
    expect(result.normalized.get("errorTest")).toBe("server");
    expect(result.normalized.get("custom")).toBe("value");
    expect(result.changed).toBe(false);
  });

  it("modeが配列の場合、最初の要素を使用し、重複除去のためchanged=trueになる", () => {
    const result = normalizeHomeSearchParams({ mode: ["memo", "todo"] });

    expect(result.normalized.get("mode")).toBe("memo");
    expect(result.changed).toBe(true);
  });

  it("viewが配列の場合、最初の要素を使用する（重複除去のためchanged=true）", () => {
    const result = normalizeHomeSearchParams({ view: ["trash", "hoge"] });

    expect(result.normalized.get("view")).toBe("trash");
    expect(result.normalized.get("mode")).toBe("all"); // modeが未指定なのでallが付与される
    expect(result.changed).toBe(true); // mode付与 + view重複除去でchanged=true
  });

  it("modeが指定されている状態でviewが配列の場合も重複除去のためchanged=trueになる", () => {
    const result = normalizeHomeSearchParams({
      mode: "memo",
      view: ["trash", "hoge"],
    });

    expect(result.normalized.get("mode")).toBe("memo");
    expect(result.normalized.get("view")).toBe("trash");
    expect(result.changed).toBe(true);
  });

  it("mode未指定でview=trashの場合、mode=allが付与されviewは維持される", () => {
    const result = normalizeHomeSearchParams({ view: "trash" });

    expect(result.normalized.get("mode")).toBe("all");
    expect(result.normalized.get("view")).toBe("trash");
    expect(result.changed).toBe(true);
  });

  it("modeが不正値でview=trashの場合、mode=allに正規化されviewは維持される", () => {
    const result = normalizeHomeSearchParams({
      mode: "invalid",
      view: "trash",
    });

    expect(result.normalized.get("mode")).toBe("all");
    expect(result.normalized.get("view")).toBe("trash");
    expect(result.changed).toBe(true);
  });
});
