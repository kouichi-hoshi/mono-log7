-- DropIndex
DROP INDEX "Post_authorId_createdAt_idx";

-- DropIndex
DROP INDEX "Post_authorId_status_mode_updatedAt_idx";

-- CreateIndex
CREATE INDEX "Post_authorId_status_updatedAt_postId_idx" ON "Post"("authorId", "status", "updatedAt", "postId");

-- CreateIndex
CREATE INDEX "Post_authorId_status_createdAt_postId_idx" ON "Post"("authorId", "status", "createdAt", "postId");

-- CreateIndex
CREATE INDEX "Post_authorId_status_mode_updatedAt_postId_idx" ON "Post"("authorId", "status", "mode", "updatedAt", "postId");

-- CreateIndex
CREATE INDEX "Post_authorId_status_mode_createdAt_postId_idx" ON "Post"("authorId", "status", "mode", "createdAt", "postId");
