/// <reference types="node" />
import { prisma } from "../src/db/client.js";
import { readIdentity, resolveUser, shutdown } from "./user-admin-helpers.js";

async function main(): Promise<void> {
  const identity = readIdentity();
  const user = await resolveUser(identity);

  const deleted = await prisma.user.delete({
    where: { id: user.id },
    select: { id: true, email: true },
  });

  console.log(`User deleted: id=${deleted.id} email=${deleted.email}`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await shutdown();
  });
