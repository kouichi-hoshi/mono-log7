import { NextResponse } from "next/server";
import type { PostMode, PostStatus } from "@/lib/postRepository";
import { prismaPostsRepository } from "@/lib/postRepository/prismaPostsRepository";
import { guardProductionPostsApi } from "@/lib/routing/guardProductionPostsApi";

function parseMode(value: string | null): PostMode | undefined {
  if (value === "memo" || value === "todo" || value === "diary") return value;
  return undefined;
}

function parseStatus(value: string | null): PostStatus | undefined {
  if (value === "active" || value === "trashed") return value;
  return undefined;
}

function parseSortBy(value: string | null): "createdAt" | "updatedAt" {
  return value === "createdAt" ? "createdAt" : "updatedAt";
}

function parseSortOrder(value: string | null): "asc" | "desc" {
  return value === "asc" ? "asc" : "desc";
}

export async function GET(request: Request) {
  const blocked = guardProductionPostsApi();
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);

  const authorId = searchParams.get("authorId") ?? undefined;
  const mode = parseMode(searchParams.get("mode"));
  const status = parseStatus(searchParams.get("status"));
  const offset =
    searchParams.get("offset") !== null
      ? Number(searchParams.get("offset"))
      : undefined;
  const limit =
    searchParams.get("limit") !== null
      ? Number(searchParams.get("limit"))
      : undefined;
  const cursor = searchParams.get("cursor") ?? undefined;
  const sortBy = parseSortBy(searchParams.get("sortBy"));
  const sortOrder = parseSortOrder(searchParams.get("sortOrder"));

  const result = await prismaPostsRepository.findMany({
    authorId,
    mode,
    status,
    offset,
    limit,
    cursor,
    sortBy,
    sortOrder,
  });

  return NextResponse.json({
    ...result,
    posts: result.posts.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
    })),
  });
}

export async function POST(request: Request) {
  const blocked = guardProductionPostsApi();
  if (blocked) return blocked;

  const body = await request.json();
  const { authorId, contentJSON, mode } = body ?? {};

  if (
    typeof authorId !== "string" ||
    typeof contentJSON !== "string" ||
    !["memo", "todo", "diary"].includes(mode)
  ) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const created = await prismaPostsRepository.create({
    authorId,
    contentJSON,
    mode,
  });

  return NextResponse.json({
    ...created,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    deletedAt: created.deletedAt ? created.deletedAt.toISOString() : null,
  });
}
