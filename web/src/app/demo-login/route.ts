import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Demo-deploy-only (see resolveDbPath in db.ts / the demo-cookie path in
 * auth.ts): transparently logs the visitor in as a seeded demo account so
 * the public preview link has no password barrier. Only reachable in the
 * sense that requireUserOrRedirect() sends unauthenticated visitors here
 * instead of /login when process.env.VERCEL is set -- everywhere else
 * (local dev, a real deploy) still uses the real /login flow.
 */
export async function GET(request: Request) {
  if (!process.env.VERCEL) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const user = await db.user.findFirst({ where: { email: "jonas@example.com" } });
  if (user) await createSession(user.id);

  return NextResponse.redirect(new URL("/", request.url));
}
