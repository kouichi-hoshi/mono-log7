import { NextResponse } from "next/server";
import { prismaPostsRepository } from "@/lib/postRepository/prismaPostsRepository";
import { guardProductionPostsApi } from "@/lib/routing/guardProductionPostsApi";

interface Params {
  params: { id: string };
}

export async function DELETE(_request: Request, { params }: Params) {
  const blocked = guardProductionPostsApi();
  if (blocked) return blocked;

  try {
    await prismaPostsRepository.hardDelete(params.id);
    return NextResponse.json({ ok: true });
  } catch (_error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
