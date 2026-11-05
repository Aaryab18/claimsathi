import { PrismaPg } from "@prisma/adapter-pg";
import type { CaseStore } from "./case-store.js";
import { PrismaClient, type Prisma } from "./generated/prisma/client.js";

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

export function createPrismaStore(connectionString: string | undefined): CaseStore {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString, max: 5, connectionTimeoutMillis: 5000 }),
  });

  return {
    async createCase({ token, stage, progressMessage, extracted, result, deleteAfter, documents }) {
      await prisma.claimCase.create({
        data: {
          token,
          status: stage,
          progressMessage,
          deleteAfter,
          ...(extracted && { extracted: asJson(extracted) }),
          ...(result && { result: asJson(result) }),
          documents: {
            create: documents.map(({ documentType, fileName, fileType, contents }) => ({
              documentType,
              fileName,
              fileType,
              contents: contents as Uint8Array<ArrayBuffer>,
              deleteAfter,
            })),
          },
        },
      });
    },

    async findCase(token) {
      const found = await prisma.claimCase.findUnique({ where: { token } });
      return (
        found && {
          token: found.token,
          stage: found.status,
          progressMessage: found.progressMessage,
          errorMessage: found.errorMessage,
          extracted: found.extracted,
          overrides: found.overrides,
          result: found.result,
          deleteAfter: found.deleteAfter,
        }
      );
    },

    async saveFacts(token, overrides, result) {
      const { count } = await prisma.claimCase.updateMany({
        where: { token },
        data: { overrides: asJson(overrides), result: asJson(result) },
      });
      return count > 0;
    },

    async deleteExpired(now) {
      const [, cases] = await prisma.$transaction([
        prisma.caseDocument.deleteMany({ where: { deleteAfter: { lte: now } } }),
        prisma.claimCase.deleteMany({ where: { deleteAfter: { lte: now } } }),
      ]);
      return cases.count;
    },
  };
}
