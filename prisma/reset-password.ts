// Set a new password for an existing user. Run with: npm run reset-password
// Uses DATABASE_URL from .env, so it acts on whichever database that points at.
import { PrismaClient } from "@prisma/client";
import { createInterface } from "readline";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();

function ask(question: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Swallow echoed keystrokes so the password isn't shown on screen.
      (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s) => {
        if (s.startsWith(question)) process.stdout.write(s);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
  });
}

async function main() {
  const email = (await ask("Email: ")).toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { email: true } });
    console.error(`No user with email ${email}. Admin accounts: ${admins.map((a) => a.email).join(", ") || "none"}`);
    process.exit(1);
  }

  const password = await ask("New password (min 8 chars): ", true);
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  const confirm = await ask("Confirm new password: ", true);
  if (password !== confirm) {
    console.error("Passwords don't match.");
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password), active: true },
  });
  console.log(`Password updated for ${user.email} (${user.role}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
