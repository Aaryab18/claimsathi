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

    async findDocuments(token) {
      const documents = await prisma.caseDocument.findMany({ where: { case: { token } } });
      return documents.map(({ documentType, fileName, fileType, contents }) => ({
        documentType,
        fileName,
        fileType,
        contents: Buffer.from(contents),
      }));
    },

    async findUnfinished() {
      const found = await prisma.claimCase.findMany({
        where: { status: { in: ["queued", "reading", "checking", "drafting"] }, deleteAfter: { gt: new Date() } },
        select: { token: true },
        orderBy: { createdAt: "asc" },
      });
      return found.map(({ token }) => token);
    },

    async setProgress(token, stage, progressMessage) {
      await prisma.claimCase.updateMany({ where: { token }, data: { status: stage, progressMessage } });
    },

    async completeCase(token, progressMessage, extracted, result) {
      await prisma.claimCase.updateMany({
        where: { token },
        data: { status: "done", progressMessage, extracted: asJson(extracted), result: asJson(result) },
      });
    },

    async failCase(token, progressMessage, errorMessage) {
      await prisma.claimCase.updateMany({ where: { token }, data: { status: "failed", progressMessage, errorMessage } });
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
