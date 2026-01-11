// Seed script for local/dev database
// Inserts the stub user used by stub auth (userId: "stub-user-1")
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: "stub-user-1" },
    update: {},
    create: {
      id: "stub-user-1",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
