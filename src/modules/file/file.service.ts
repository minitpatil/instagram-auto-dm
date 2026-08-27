import { prisma } from "../../lib/prisma";

interface CreateFileInput {
  userId: string;
  name: string;
  content: string;
  mimeType: string;
}

export async function createFile(input: CreateFileInput) {
  return prisma.file.create({
    data: {
      userId: input.userId,
      name: input.name,
      content: input.content,
      mimeType: input.mimeType,
    },
  });
}

export async function getFiles(userId: string) {
  return prisma.file.findMany({
    where: {
      userId,
    },
    select: {
      id: true,
      name: true,
      mimeType: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getFileById(userId: string, fileId: string) {
  return prisma.file.findFirst({
    where: {
      id: fileId,
      userId,
    },
  });
}

/*
|--------------------------------------------------------------------------
| PUBLIC FILE
|--------------------------------------------------------------------------
*/

export async function getPublicFileById(fileId: string) {
  return prisma.file.findUnique({
    where: {
      id: fileId,
    },
    select: {
      id: true,
      name: true,
      content: true,
      mimeType: true,
    },
  });
}

export async function deleteFile(userId: string, fileId: string) {
  return prisma.file.deleteMany({
    where: {
      id: fileId,
      userId,
    },
  });
}

export async function getFileContentById(fileId: string) {
  return prisma.file.findUnique({
    where: {
      id: fileId,
    },
  });
}