/// <reference types="node" />
import { prisma } from "../src/db/client.js";
import { readIdentity, resolveUser, shutdown } from "./user-admin-helpers.js";

async function main(): Promise<void> {
  const identity = readIdentity();
  const user = await resolveUser(identity);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role: "admin" },
    select: { id: true, email: true, role: true },
  });

  console.log(`Role updated: id=${updated.id} email=${updated.email} role=${updated.role}`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Failed to update role";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await shutdown();
  });
