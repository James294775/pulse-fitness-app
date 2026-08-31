"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TabExploreIcon,
  TabFeedIcon,
  TabGroupsIcon,
  TabRecordIcon,
  TabYouIcon,
} from "@/components/icons";

const tabs = [
  { href: "/", label: "FEED", Icon: TabFeedIcon },
  { href: "/explore", label: "EXPLORE", Icon: TabExploreIcon },
  { href: "/record", label: "RECORD", Icon: TabRecordIcon },
  { href: "/clubs", label: "GROUPS", Icon: TabGroupsIcon },
  { href: "/dashboard", label: "YOU", Icon: TabYouIcon },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 grid grid-cols-5 items-center border-t border-border-strong bg-bg pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5">
      {tabs.map(({ href, label, Icon }) => {
        const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        if (href === "/record") {
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 py-1">
              <span className="flex h-[28px] w-[38px] items-center justify-center rounded-[5px] bg-accent text-accent-ink">
                <Icon size={17} />
              </span>
              <span className="text-[9px] font-semibold tracking-[0.1em] text-accent">
                {label}
              </span>
            </Link>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 py-1 ${
              isActive ? "text-text" : "text-secondary"
            }`}
          >
            <Icon size={19} />
            <span className="text-[9px] font-semibold tracking-[0.1em]">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
