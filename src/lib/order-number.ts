import { randomBytes } from "crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

/**
 * Generates the next order number for the given year, e.g. LGS-2026-000001.
 * Uses an atomic upsert+increment against a per-year counter row so
 * concurrent order creation never collides, even under load.
 *
 * IMPORTANT: pass the `tx` client when calling this from inside an existing
 * `prisma.$transaction(...)` — SQLite only allows one writer at a time, so
 * starting a second, independent transaction while the first is still open
 * will block until it times out.
 */
export async function generateOrderNumber(client: PrismaClientOrTx, date: Date = new Date()): Promise<string> {
  const year = date.getFullYear();

  const counter = await client.orderNumberCounter.upsert({
    where: { year },
    update: { count: { increment: 1 } },
    create: { year, count: 1 },
  });

  const padded = String(counter.count).padStart(6, "0");
  return `LGS-${year}-${padded}`;
}

/** Cryptographically strong, URL-safe token for public tracking links. */
export function generateTrackingToken(): string {
  return randomBytes(24).toString("base64url");
}
