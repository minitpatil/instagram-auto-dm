import { prisma } from "../../lib/prisma";

interface AddInstagramAccountInput {
  instagramUserId: string;
  username: string;
  name?: string;
  accessTokenEncrypted: string;
}

export async function addInstagramAccount(
  userId: string,
  input: AddInstagramAccountInput
) {
  const account = await prisma.instagramAccount.create({
    data: {
      userId,
      instagramUserId: input.instagramUserId,
      username: input.username,
      name: input.name,
      accessTokenEncrypted: input.accessTokenEncrypted,
    },
  });

  return account;
}

export async function getInstagramAccounts(userId: string) {
  return prisma.instagramAccount.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      instagramUserId: true,
      username: true,
      name: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}