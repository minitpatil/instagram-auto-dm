import { prisma } from "./lib/prisma.ts";

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

await prisma.$disconnect();