"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col items-center justify-center gap-4 border-x border-border-weak bg-bg px-6 text-center">
      <p className="text-xs font-semibold tracking-[0.15em] text-tertiary">SOMETHING WENT WRONG</p>
      <p className="text-sm text-secondary">
        An unexpected error occurred. You can try again, or head back to the feed.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded bg-accent px-4 py-2 text-xs font-bold tracking-[0.1em] text-accent-ink"
        >
          TRY AGAIN
        </button>
        <Link
          href="/"
          className="rounded border border-border-strong px-4 py-2 text-xs font-bold tracking-[0.1em] text-secondary"
        >
          BACK TO FEED
        </Link>
      </div>
    </div>
  );
}
