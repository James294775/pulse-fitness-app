import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Demo-deploy-only (see resolveDbPath in db.ts / the demo-cookie path in
 * auth.ts): transparently logs the visitor in as a seeded demo account so
 * the public preview link has no password barrier. Only reachable in the
 * sense that requireUserOrRedirect() sends unauthenticated visitors here
 * instead of /login when process.env.VERCEL is set -- everywhere else
 * (local dev, a real deploy) still uses the real /login flow.
 *
 * Uses next/navigation's redirect(), not NextResponse.redirect() -- the
 * latter builds its own response object that doesn't reliably carry the
 * Set-Cookie header from createSession()'s cookies().set() call, which
 * caused a redirect loop (cookie never actually landed, so the next visit
 * to "/" looked unauthenticated again and bounced back here).
 */
export async function GET() {
  if (!process.env.VERCEL) redirect("/login");

  const user = await db.user.findFirst({ where: { email: "jonas@example.com" } });
  if (user) await createSession(user.id);

  redirect("/");
}
