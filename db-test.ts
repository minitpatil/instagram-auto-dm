import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🔌 Connecting to Neon PostgreSQL...");

  await prisma.$connect();

  console.log("✅ Database connection successful!");

  const result = await prisma.$queryRaw`SELECT NOW()`;

  console.log("🕒 Database time:", result);

  await prisma.$disconnect();

  console.log("🔒 Database connection closed.");
}

main().catch(async (error) => {
  console.error("❌ Database connection failed:");
  console.error(error);

  await prisma.$disconnect();
  process.exit(1);
});