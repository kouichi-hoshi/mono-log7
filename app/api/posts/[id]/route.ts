import { NextResponse } from "next/server";
import { prismaPostsRepository } from "@/lib/postRepository/prismaPostsRepository";
import { guardProductionPostsApi } from "@/lib/routing/guardProductionPostsApi";

interface Params {
  params: { id: string };
}

export async function GET(_request: Request, { params }: Params) {
  const blocked = guardProductionPostsApi();
  if (blocked) return blocked;

  const post = await prismaPostsRepository.findById(params.id);
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    deletedAt: post.deletedAt ? post.deletedAt.toISOString() : null,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const blocked = guardProductionPostsApi();
  if (blocked) return blocked;

  const body = await request.json();
  const { contentJSON, mode } = body ?? {};
  try {
    const updated = await prismaPostsRepository.update(params.id, {
      ...(typeof contentJSON === "string" && { contentJSON }),
      ...(typeof mode === "string" && { mode }),
    });
    return NextResponse.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      deletedAt: updated.deletedAt ? updated.deletedAt.toISOString() : null,
    });
  } catch (_error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
