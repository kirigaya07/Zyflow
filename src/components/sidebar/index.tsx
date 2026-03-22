"use client";

import { usePathname } from "next/navigation";
import { LoadingLink } from "@/components/global/loading-link";
import { menuOptions } from "@/lib/constants";
import { ModeToggle } from "@/components/global/mode-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-14 h-screen border-r border-border bg-background shrink-0 z-20">
      {/* Logo */}
      <div className="flex items-center justify-center h-14 border-b border-border shrink-0">
        <LoadingLink href="/dashboard" aria-label="Zyflow home">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Zap className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
          </div>
        </LoadingLink>
      </div>

      {/* Nav */}
      <nav className="flex flex-col flex-1 items-center gap-1 py-3 px-2 overflow-y-auto">
        <TooltipProvider delayDuration={0}>
          {menuOptions.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <LoadingLink
                    href={item.href}
                    aria-label={item.name}
                    className={cn(
                      "relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                    )}
                    <item.Component selected={isActive} />
                  </LoadingLink>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  <p className="text-xs font-medium">{item.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Bottom */}
      <div className="flex items-center justify-center h-12 border-t border-border shrink-0">
        <ModeToggle />
      </div>
    </aside>
  );
};

export default Sidebar;
