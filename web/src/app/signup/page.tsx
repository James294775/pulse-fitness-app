import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
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
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Create your account</h1>
      <SignupForm />
      <p className="mt-6 text-sm text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}
