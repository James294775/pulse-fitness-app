import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-6">
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded bg-accent text-accent-ink">
          <span className="text-lg font-bold">P</span>
        </span>
        <span className="text-xl font-bold tracking-[0.2em]">PULSE</span>
      </div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Log in</h1>
      <LoginForm />
      <p className="mt-6 text-sm text-secondary">
        New to Pulse?{" "}
        <Link href="/signup" className="font-semibold text-accent">
          Create an account
        </Link>
      </p>
    </div>
  );
}
