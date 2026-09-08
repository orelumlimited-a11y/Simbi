import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

// --- Simple in-memory rate limiter for the public tracking endpoint -------
// Token bucket per IP. This is process-local (fine for a single-instance
// deployment / demo); swap for a shared store (Redis) behind a load balancer.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const buckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > MAX_REQUESTS_PER_WINDOW;
}

const PUBLIC_PATHS = ["/login", "/api/auth", "/track", "/_next", "/favicon.ico"];

function isAdminOnly(pathname: string) {
  return pathname.startsWith("/settings");
}

function isFinancePath(pathname: string) {
  return pathname.startsWith("/finance");
}

function isDriverPath(pathname: string) {
  return pathname.startsWith("/driver");
}

function isInternalDashboardPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/drivers") ||
    pathname.startsWith("/vehicles") ||
    pathname.startsWith("/vendors") ||
    pathname.startsWith("/finance") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings")
  );
}

export const proxy = auth(async (req: NextRequest & { auth?: unknown }) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/track/")) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (isRateLimited(`track:${ip}`)) {
      return new NextResponse("Too many requests. Please try again in a minute.", {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) || pathname === "/") {
    return NextResponse.next();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = (req as any).auth as
    | { user?: { role?: string; financeAccess?: boolean } }
    | null
    | undefined;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role;

  if (isDriverPath(pathname)) {
    if (role !== "DRIVER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (isInternalDashboardPath(pathname)) {
    if (role === "DRIVER") {
      return NextResponse.redirect(new URL("/driver", req.url));
    }
    if (isAdminOnly(pathname) && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (isFinancePath(pathname) && role !== "ADMIN" && !session.user.financeAccess) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
