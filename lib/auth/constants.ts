export const USE_STUB_AUTH =
  process.env.NEXT_PUBLIC_USE_STUB_AUTH === "true" &&
  process.env.NODE_ENV !== "production";

export const STUB_SESSION_COOKIE_NAME = "stub-session";
