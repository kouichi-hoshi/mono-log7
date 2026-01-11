import { NextResponse } from "next/server";

export function guardProductionPostsApi() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "Posts API is disabled in production until Auth.js-based authz is implemented.",
      },
      { status: 403 },
    );
  }
  return null;
}
