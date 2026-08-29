import "dotenv/config";
import { prisma } from "./src/lib/prisma.ts";

async function main() {
  const account = await prisma.instagramAccount.update({
    where: {
      id: "87b3ee8d-7f95-4358-afb9-ecc9da64b0bd",
    },
    data: {
      instagramUserId: "17841412323688825",
      username: "swatpat.solutions",
      name: "SwatPat Solutions",
    },
  });

  console.log("Updated:", account);
}

main()
  .catch((error) => {
    console.error("Update failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });