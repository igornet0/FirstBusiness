/// <reference types="node" />
import "dotenv/config";
import { prisma, disconnectPrisma } from "../src/db/client.js";

export function fail(message: string): never {
  console.error(message);
  process.exit(1);
  throw new Error(message);
}

export function readIdentity(): { email?: string; id?: string } {
  const email = process.env.EMAIL?.trim().toLowerCase();
  const id = process.env.ID?.trim();

  if (!email && !id) {
    fail("Provide EMAIL or ID. Example: make block-user EMAIL=user@example.com");
  }

  return { email, id };
}

export async function resolveUser(identity: {
  email?: string;
  id?: string;
}): Promise<{ id: string; email: string }> {
  if (identity.id) {
    const byId = await prisma.user.findUnique({
      where: { id: identity.id },
      select: { id: true, email: true },
    });
    if (byId) return byId;
  }

  if (identity.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: identity.email },
      select: { id: true, email: true },
    });
    if (byEmail) return byEmail;
  }

  fail("User not found by provided EMAIL/ID.");
}

export async function shutdown(): Promise<void> {
  await disconnectPrisma();
}
