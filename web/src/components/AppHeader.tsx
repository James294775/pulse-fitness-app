import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BellIcon, LogoMark, SearchIcon } from "@/components/icons";
import type { PublicUser } from "@/lib/auth";

export function AppHeader({ user }: { user: PublicUser }) {
  const initials = user.displayName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg px-5 py-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded bg-accent text-accent-ink">
          <LogoMark size={16} />
        </span>
        <span className="text-[17px] font-bold tracking-[0.2em]">PULSE</span>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <SearchIcon className="text-secondary" />
        <div className="relative">
          <BellIcon className="text-secondary" />
          <span className="absolute -right-px -top-px h-[7px] w-[7px] rounded border-[1.5px] border-bg bg-accent" />
        </div>
        <Link
          href="/settings/profile"
          className="flex h-[26px] w-[26px] items-center justify-center rounded border border-border-strong bg-surface text-[10px] font-semibold text-tertiary"
        >
          {initials || "?"}
        </Link>
      </div>
    </header>
  );
}
