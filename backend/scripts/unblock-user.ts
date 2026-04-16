/// <reference types="node" />
import { prisma } from "../src/db/client.js";
import { readIdentity, resolveUser, shutdown } from "./user-admin-helpers.js";

async function main(): Promise<void> {
  const identity = readIdentity();
  const user = await resolveUser(identity);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { isActive: 1 },
    select: { id: true, email: true, isActive: true },
  });

  console.log(
    `User unblocked: id=${updated.id} email=${updated.email} isActive=${updated.isActive ? 1 : 0}`
  );
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Failed to unblock user";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await shutdown();
  });
