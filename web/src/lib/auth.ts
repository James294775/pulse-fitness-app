import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash, createHmac } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { User } from "@/generated/prisma/client";

const SESSION_COOKIE = "pulse_session";
const SESSION_TTL_DAYS = 30;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Demo-deploy-only (see resolveDbPath in db.ts): each request can land on a
 * different serverless instance, each with its own isolated /tmp SQLite
 * copy, so a `Session` row written by one instance is invisible to the
 * next -- login would work for one request and silently look logged-out on
 * the next. A self-verifying signed cookie sidesteps that by trusting the
 * `User` table instead (baked identically into every instance) rather than
 * a session row that only exists on whichever instance wrote it. The
 * secret being a constant is fine here: this only ever runs against a
 * throwaway public preview deploy with published demo credentials, never
 * against a real deploy (those use Postgres and the real DB-backed
 * sessions below). Signing up a NEW account on the demo deploy still won't
 * reliably work, since that user row itself only exists on one instance.
 */
const DEMO_SECRET = "pulse-demo-preview-not-a-real-secret";

function signDemoToken(userId: string) {
  return `${userId}.${createHmac("sha256", DEMO_SECRET).update(userId).digest("hex")}`;
}

function verifyDemoToken(token: string): string | null {
  const i = token.indexOf(".");
  if (i < 0) return null;
  const userId = token.slice(0, i);
  const expected = createHmac("sha256", DEMO_SECRET).update(userId).digest("hex");
  return token.slice(i + 1) === expected ? userId : null;
}

/** Creates a session and sets the session cookie. Call only from a Server Action or Route Handler. */
export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const cookieValue = process.env.VERCEL ? signDemoToken(userId) : randomBytes(32).toString("hex");

  if (!process.env.VERCEL) {
    await db.session.create({
      data: { userId, tokenHash: hashToken(cookieValue), expiresAt },
    });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Clears the current session, both the DB row and the cookie. Call only from a Server Action or Route Handler. */
export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && !process.env.VERCEL) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Reads the current user from the session cookie. Safe to call from Server Components. Returns null if unauthenticated or the session expired. */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  if (process.env.VERCEL) {
    const userId = verifyDemoToken(token);
    return userId ? db.user.findUnique({ where: { id: userId } }) : null;
  }

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

/** Throws if there is no authenticated user. Use at the top of any Server Component, Server Action, or Route Handler that reads or writes user-owned data. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

export class AuthError extends Error {}

/**
 * A User with passwordHash stripped. Server Components must pass this (never
 * the raw `User` from @/generated/prisma/client) into any "use client"
 * component — Client Component props get serialized into the page's RSC
 * payload and shipped to the browser as-is, hash included.
 */
export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser({ passwordHash, ...publicUser }: User): PublicUser {
  void passwordHash;
  return publicUser;
}

/**
 * For Server Components/pages: redirects to /login instead of throwing.
 * On the demo Vercel deploy, redirects to /demo-login instead, which
 * transparently logs the visitor in as a seeded account -- see
 * src/app/demo-login/route.ts. No-op change everywhere else.
 */
export async function requireUserOrRedirect(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(process.env.VERCEL ? "/demo-login" : "/login");
  return user;
}
