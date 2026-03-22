"use client";

import { usePathname } from "next/navigation";
import { LoadingLink } from "@/components/global/loading-link";
import { menuOptions } from "@/lib/constants";
import { cn } from "@/lib/utils";

const MobileNav = () => {
  const pathname = usePathname();

  if (pathname.includes("/workflows/editor/")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden h-16 border-t border-border bg-background/95 backdrop-blur-md">
      {menuOptions.map((item) => {
        const isActive = pathname === item.href;
        return (
          <LoadingLink
            key={item.name}
            href={item.href}
            aria-label={item.name}
            className={cn(
              "group relative flex flex-1 items-center justify-center transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-b-full" />
            )}
            <item.Component selected={isActive} />
          </LoadingLink>
        );
      })}
    </nav>
  );
};

export default MobileNav;
