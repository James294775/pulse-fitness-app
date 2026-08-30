import type { ReactNode } from "react";
import { TabBar } from "@/components/TabBar";

export function AppShell({
  children,
  withTabBar = true,
}: {
  children: ReactNode;
  withTabBar?: boolean;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-border-weak bg-bg">
      <div className={`flex flex-1 flex-col ${withTabBar ? "pb-[84px]" : ""}`}>{children}</div>
      {withTabBar && <TabBar />}
    </div>
  );
}
