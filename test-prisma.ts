import "dotenv/config";
import { prisma } from "./src/lib/prisma.ts";

async function main() {
  console.log("🔌 Testing Prisma service...");

  const users = await prisma.user.count();

  console.log("✅ Prisma service working!");
  console.log("👤 Users in database:", users);
}

main()
  .catch((error) => {
    console.error("❌ Prisma service failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });