import { auth } from "@/auth";
import type { Role } from "@/lib/constants";

export class UnauthorizedError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Throws if there is no authenticated session. Returns the session otherwise. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError("You must be signed in.");
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new UnauthorizedError(`This action requires one of: ${roles.join(", ")}`);
  }
  return session;
}

export async function requireFinanceAccess() {
  const session = await requireSession();
  if (session.user.role !== "ADMIN" && !session.user.financeAccess) {
    throw new UnauthorizedError("Financial data access is restricted.");
  }
  return session;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}
