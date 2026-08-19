import "dotenv/config";
import { registerUser, loginUser } from "./src/modules/auth/auth.service.ts";

async function main() {
  console.log("🔐 Testing Auth Service...\n");

  const testEmail = `test-${Date.now()}@example.com`;

  console.log("📝 Registering user...");

  const registered = await registerUser({
    name: "Test User",
    email: testEmail,
    password: "Test@12345",
  });

  console.log("✅ Registration successful");
  console.log("User:", registered.user);
  console.log("JWT received:", Boolean(registered.token));

  console.log("\n🔑 Testing login...");

  const loggedIn = await loginUser({
    email: testEmail,
    password: "Test@12345",
  });

  console.log("✅ Login successful");
  console.log("User:", loggedIn.user);
  console.log("JWT received:", Boolean(loggedIn.token));
}

main()
  .catch((error) => {
    console.error("❌ AUTH TEST FAILED");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("./src/lib/prisma.ts");
    await prisma.$disconnect();
  });