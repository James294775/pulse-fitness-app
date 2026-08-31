import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash } from "crypto";
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

/** Creates a session row and sets the session cookie. Call only from a Server Action or Route Handler. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
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
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Reads the current user from the session cookie. Safe to call from Server Components. Returns null if unauthenticated or the session expired. */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

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
