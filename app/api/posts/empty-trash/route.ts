import { NextResponse } from "next/server";
import { prismaPostsRepository } from "@/lib/postRepository/prismaPostsRepository";
import { guardProductionPostsApi } from "@/lib/routing/guardProductionPostsApi";

export async function POST(request: Request) {
  const blocked = guardProductionPostsApi();
  if (blocked) return blocked;

  const body = await request.json();
  const { authorId } = body ?? {};

  if (typeof authorId !== "string") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  await prismaPostsRepository.emptyTrash(authorId);
  return NextResponse.json({ ok: true });
}
