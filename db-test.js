require("dotenv").config();

const { PrismaClient } = require("./generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🔌 Connecting to Neon PostgreSQL...");

  await prisma.$connect();

  console.log("✅ Database connection successful!");

  const result = await prisma.$queryRaw`SELECT NOW()`;

  console.log("🕒 Database time:", result[0]);

  await prisma.$disconnect();

  console.log("🔒 Database connection closed.");
}

main().catch(async (error) => {
  console.error("❌ Database connection failed:");
  console.error(error);

  await prisma.$disconnect();
  process.exit(1);
});