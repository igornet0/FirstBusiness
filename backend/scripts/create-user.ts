/// <reference types="node" />
import "dotenv/config";
import { createUser } from "../src/db/repositories/userRepository.js";
import { disconnectPrisma } from "../src/db/client.js";
import { isUserRole, type UserRole } from "../src/types/user.js";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
  throw new Error(message);
}

async function main(): Promise<void> {
  const email = process.env.EMAIL?.trim();
  const password = process.env.PASS;
  const roleRaw = process.env.ROLE?.trim().toLowerCase() ?? "user";

  if (!email) {
    fail("EMAIL is required. Example: make create-user EMAIL=test@example.com PASS=secret123 ROLE=admin");
  }
  if (!password) {
    fail("PASS is required. Example: make create-user EMAIL=test@example.com PASS=secret123 ROLE=admin");
  }
  if (password.length < 6) {
    fail("PASS must be at least 6 characters long.");
  }
  if (!isUserRole(roleRaw)) {
    fail("ROLE must be one of: admin, user, bot.");
  }

  const user = await createUser(email, password, roleRaw as UserRole);
  console.log(`User created: id=${user.id} email=${user.email} role=${user.role}`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Failed to create user";
    console.error(message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
