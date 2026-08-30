import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center gap-4 border-x border-border-weak bg-bg px-6 text-center">
      <p className="text-xs font-semibold tracking-[0.15em] text-tertiary">404</p>
      <p className="text-sm text-secondary">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
      <Link href="/" className="rounded bg-accent px-4 py-2 text-xs font-bold tracking-[0.1em] text-accent-ink">
        BACK TO FEED
      </Link>
    </div>
  );
}
