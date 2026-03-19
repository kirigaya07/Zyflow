"use client";

import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":   "Dashboard",
  "/workflows":   "Workflows",
  "/connections": "Connections",
  "/settings":    "Settings",
  "/billing":     "Billing",
  "/templates":   "Templates",
  "/logs":        "Logs",
};

const InfoBar = () => {
  const pathname = usePathname();

  // Editor has its own full-screen toolbar — no top bar needed
  if (pathname.includes("/workflows/editor/")) return null;

  const title = PAGE_TITLES[pathname] ?? "";

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-foreground tracking-tight">
        {title}
      </h1>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-secondary border border-border text-muted-foreground text-xs">
          <Search className="w-3.5 h-3.5 shrink-0" />
          <Input
            placeholder="Search…"
            className="border-none bg-transparent h-auto p-0 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground w-28"
          />
        </div>

        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-7 h-7",
              userButtonPopover: "z-[200]",
            },
          }}
        />
      </div>
    </header>
  );
};

export default InfoBar;
