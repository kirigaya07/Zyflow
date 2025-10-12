"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { menuOptions } from "@/lib/constants";
import clsx from "clsx";
import { Separator } from "@/components/ui/separator";
import { Database, GitBranch, LucideMousePointerClick } from "lucide-react";
import { ModeToggle } from "@/components/global/mode-toggle";

const MenuOptions = () => {
  const pathName = usePathname();

  return (
    <nav
      className="dark:bg-black h-screen overflow-y-auto justify-between flex items-center flex-col gap-10 py-6 px-2"
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <div className="flex items-center justify-center flex-col gap-8">
        <Link
          className="flex font-bold flex-row text-xl hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          href="/"
        >
          Zyflow
        </Link>
        <TooltipProvider>
          <div className="flex flex-col gap-2">
            {menuOptions.map((menuItem) => (
              <Tooltip key={menuItem.name} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link
                    href={menuItem.href}
                    className={clsx(
                      "group h-8 w-8 flex items-center justify-center scale-110 rounded-lg p-1 cursor-pointer transition-all duration-200",
                      {
                        "dark:bg-purple-900 bg-purple-100":
                          pathName === menuItem.href,
                        "hover:bg-gray-100 dark:hover:bg-gray-800":
                          pathName !== menuItem.href,
                      }
                    )}
                    aria-label={menuItem.name}
                  >
                    <menuItem.Component selected={pathName === menuItem.href} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-black/10 backdrop-blur-xl"
                >
                  <p>{menuItem.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
        <Separator />
        <div className="flex items-center flex-col gap-6 bg-gray-100/50 dark:bg-gray-800/30 py-4 px-2 rounded-full min-h-[200px] max-h-[240px] overflow-y-auto border border-gray-200 dark:border-gray-700">
          {[
            { Icon: LucideMousePointerClick, isActive: true },
            { Icon: GitBranch, isActive: false },
            { Icon: Database, isActive: false },
            { Icon: GitBranch, isActive: false },
          ].map((item, index) => (
            <div key={index} className="relative group">
              <div
                className={clsx(
                  "relative p-2 rounded-full border transition-all duration-200",
                  {
                    "bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700":
                      item.isActive,
                    "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600":
                      !item.isActive,
                  }
                )}
              >
                <item.Icon
                  className={clsx("size-[18px]", {
                    "text-purple-600 dark:text-purple-300": item.isActive,
                    "text-gray-500 dark:text-gray-400": !item.isActive,
                  })}
                />
              </div>
              {index < 3 && (
                <div className="border-l-2 border-gray-300 dark:border-gray-600 h-6 absolute left-1/2 transform -translate-x-1/2 -bottom-[24px]" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center flex-col gap-8">
        <ModeToggle />
      </div>
    </nav>
  );
};

export default MenuOptions;
