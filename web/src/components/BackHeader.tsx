import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export function BackHeader({
  label,
  href,
  title,
}: {
  label: string;
  href: string;
  title?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg px-5 py-4">
      <Link href={href} className="flex items-center gap-2 text-tertiary">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M11 3L5 9l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
        </svg>
        <span className="text-xs font-semibold tracking-[0.12em]">{label}</span>
      </Link>
      {title && <span className="text-xs font-semibold tracking-[0.16em]">{title}</span>}
      <ThemeToggle />
    </header>
  );
}
