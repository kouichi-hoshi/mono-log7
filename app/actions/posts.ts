"use server";

import type {
  CreatePostInput,
  FindManyOptions,
  FindManyResult,
  PostDTO,
  UpdatePostInput,
} from "@/lib/postRepository";
import { prismaPostsRepository } from "@/lib/postRepository/prismaPostsRepository";

export async function createPost(input: CreatePostInput): Promise<PostDTO> {
  return prismaPostsRepository.create(input);
}

export async function findManyPosts(
  options?: FindManyOptions,
): Promise<FindManyResult> {
  return prismaPostsRepository.findMany(options);
}

export async function findPostById(postId: string): Promise<PostDTO | null> {
  return prismaPostsRepository.findById(postId);
}

export async function updatePost(
  postId: string,
  input: UpdatePostInput,
): Promise<PostDTO> {
  return prismaPostsRepository.update(postId, input);
}

export async function softDeletePost(postId: string): Promise<void> {
  return prismaPostsRepository.softDelete(postId);
}

export async function restorePost(postId: string): Promise<void> {
  return prismaPostsRepository.restore(postId);
}

export async function hardDeletePost(postId: string): Promise<void> {
  return prismaPostsRepository.hardDelete(postId);
}

export async function emptyTrashByAuthor(authorId: string): Promise<void> {
  return prismaPostsRepository.emptyTrash(authorId);
}
