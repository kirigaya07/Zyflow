"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * ThemeProvider component that wraps the next-themes provider.
 *
 * This provider handles:
 * - Light/dark theme switching
 * - Theme persistence across sessions
 * - System theme detection and following
 * - Hydration-safe theme initialization
 *
 * Features:
 * - Supports multiple theme modes (light, dark, system)
 * - Automatic theme detection from system preferences
 * - Theme persistence in localStorage
 * - Smooth theme transitions
 * - SSR-compatible theme loading
 *
 * @param children - Child components that will have access to theme context
 * @param props - Additional props passed to NextThemesProvider
 * @returns JSX.Element - Theme provider wrapper with theme management
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
