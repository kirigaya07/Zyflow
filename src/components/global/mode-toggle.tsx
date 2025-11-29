/**
 * Theme Mode Toggle Component
 *
 * This component provides a user-friendly interface for switching between theme modes:
 * - Light, dark, and system theme options
 * - Animated icon transitions between sun and moon
 * - Dropdown menu with clear theme selection options
 * - Integration with next-themes for persistent theme management
 *
 * Features:
 * - Smooth icon animations with CSS transitions
 * - System theme detection and preference following
 * - Persistent theme storage across sessions
 * - Accessible design with screen reader support
 * - Clean dropdown interface with clear option labels
 */

"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Theme mode toggle component with animated icons and dropdown selection.
 *
 * This component provides:
 * - Visual theme switching with animated sun/moon icons
 * - Three theme options: Light, Dark, and System preference
 * - Smooth transitions and visual feedback for theme changes
 * - Integration with next-themes for theme persistence and SSR support
 *
 * Theme options:
 * - Light: Bright theme optimized for daytime use
 * - Dark: Dark theme optimized for low-light environments
 * - System: Automatically follows user's OS theme preference
 *
 * Accessibility features:
 * - Screen reader support with descriptive labels
 * - Keyboard navigation support through dropdown menu
 * - High contrast icons for clear visual indication
 * - Semantic button and menu structure
 *
 * Animation features:
 * - CSS transitions for smooth icon transformations
 * - Icon rotation and scaling effects for theme state indication
 * - Responsive design that works across device sizes
 *
 * @returns JSX.Element - Theme toggle button with dropdown menu
 */
export function ModeToggle() {
  const { setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
