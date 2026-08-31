import { redirect } from "next/navigation";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Demo-deploy-only: transparently logs the visitor in as a seeded demo
 * account so the public preview link has no password barrier. Only
 * reachable in the sense that requireUserOrRedirect() sends unauthenticated
 * visitors here instead of /login when process.env.VERCEL is set --
 * everywhere else (local dev, a real deploy) still uses the real /login
 * flow.
 *
 * Uses next/navigation's redirect(), not NextResponse.redirect() -- the
 * latter builds its own response object that doesn't reliably carry the
 * Set-Cookie header from createSession()'s cookies().set() call, which
 * previously caused a redirect loop (cookie never actually landed, so the
 * next visit to "/" looked unauthenticated and bounced back here).
 */
export async function GET() {
  if (!process.env.VERCEL) redirect("/login");

  const user = await db.user.findFirst({ where: { email: "jonas@example.com" } });
  if (!user) {
    return new Response("Demo login failed: seeded account not found. Has the database been seeded?", {
      status: 500,
    });
  }

  await createSession(user.id);
  redirect("/");
}
