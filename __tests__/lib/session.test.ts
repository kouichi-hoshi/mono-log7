import * as authServer from "@/lib/authAdapter/server";
import { getSession, isAuthenticated } from "@/lib/session";

jest.mock("@/lib/authAdapter/server", () => ({
  getSession: jest.fn(),
  USE_STUB_AUTH: true,
  STUB_SESSION_COOKIE_NAME: "stub-session",
}));

describe("session utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSession", () => {
    it("authAdapter.getSessionの結果を返す", async () => {
      const mockSession = {
        userId: "stub-user-1",
        email: "stub@example.com",
        name: "スタブユーザー",
      };
      (authServer.getSession as jest.Mock).mockResolvedValue(mockSession);

      const result = await getSession();

      expect(result).toEqual(mockSession);
      expect(authServer.getSession).toHaveBeenCalledTimes(1);
    });

    it("未ログイン時はnullを返す", async () => {
      (authServer.getSession as jest.Mock).mockResolvedValue(null);

      const result = await getSession();

      expect(result).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("ログイン時はtrueを返す", async () => {
      (authServer.getSession as jest.Mock).mockResolvedValue({
        userId: "stub-user-1",
        email: "stub@example.com",
        name: "スタブユーザー",
      });

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it("未ログイン時はfalseを返す", async () => {
      (authServer.getSession as jest.Mock).mockResolvedValue(null);

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
