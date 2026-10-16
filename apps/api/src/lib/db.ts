import { Prisma, PrismaClient } from "@prisma/client";

export type Db = PrismaClient;
/** A transaction client; repositories accept it so services can compose atomic operations. */
export type Tx = Prisma.TransactionClient;

export function createDb(): Db {
  return new PrismaClient();
}

export function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}
/** Column names (or index name) that caused a unique violation. */
export function uniqueTarget(err: unknown): string {
  return err instanceof Prisma.PrismaClientKnownRequestError ? JSON.stringify(err.meta?.target ?? "") : "";
}
export function isForeignKeyViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003";
}
