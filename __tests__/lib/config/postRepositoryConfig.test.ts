import { shouldUseStubPosts } from "@/lib/config/postRepositoryConfig";

const originalNodeEnv = process.env.NODE_ENV;
const originalStubFlag = process.env.NEXT_PUBLIC_USE_STUB_POSTS;

function setEnv(key: string, value: string): void {
  Object.defineProperty(process.env, key, {
    value,
    writable: true,
    enumerable: true,
    configurable: true,
  });
}

function deleteEnv(key: string): void {
  delete (process.env as Record<string, string | undefined>)[key];
}

function restoreEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    deleteEnv(key);
  } else {
    setEnv(key, value);
  }
}

describe("postRepositoryConfig", () => {
  afterEach(() => {
    restoreEnv("NODE_ENV", originalNodeEnv);
    restoreEnv("NEXT_PUBLIC_USE_STUB_POSTS", originalStubFlag);
  });

  it("NODE_ENV=production では false を返す", () => {
    setEnv("NODE_ENV", "production");
    setEnv("NEXT_PUBLIC_USE_STUB_POSTS", "true");

    expect(shouldUseStubPosts()).toBe(false);
  });

  it("NEXT_PUBLIC_USE_STUB_POSTS=false では false を返す", () => {
    setEnv("NODE_ENV", "development");
    setEnv("NEXT_PUBLIC_USE_STUB_POSTS", "false");

    expect(shouldUseStubPosts()).toBe(false);
  });

  it("スタブ有効条件を満たすと true を返す", () => {
    setEnv("NODE_ENV", "development");
    setEnv("NEXT_PUBLIC_USE_STUB_POSTS", "true");

    expect(shouldUseStubPosts()).toBe(true);
  });
});
