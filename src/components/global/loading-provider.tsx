/**
 * Global Loading Provider Component
 *
 * This component provides application-wide loading state management and UI:
 * - Automatic loading detection based on route changes
 * - Centralized loading overlay with consistent design
 * - Navigation-aware loading states for smooth user experience
 * - Backdrop blur and loading spinner with branded styling
 *
 * Features:
 * - Route change detection with pathname and search params monitoring
 * - Timed loading states to prevent flickering
 * - Full-screen overlay with backdrop blur effects
 * - Accessible loading indicators with proper contrast
 * - Integration with Next.js navigation system
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Global loading provider component that manages application-wide loading states.
 *
 * This component handles:
 * - Automatic loading state detection based on navigation changes
 * - Centralized loading UI with consistent design patterns
 * - Smooth transitions with appropriate timing controls
 * - Full-screen loading overlay with accessibility considerations
 *
 * Loading behavior:
 * - Activates on pathname or search parameter changes
 * - Displays for a minimum duration to prevent flashing
 * - Uses backdrop blur for visual depth and focus
 * - Provides clear loading feedback with spinner and text
 *
 * Design features:
 * - Full viewport overlay with centered loading indicator
 * - Backdrop blur effect for depth and focus
 * - Branded color scheme with primary theme colors
 * - Responsive design that works across device sizes
 * - Accessible text with proper contrast ratios
 *
 * Integration:
 * - Works seamlessly with Next.js App Router navigation
 * - Compatible with both client and server-side routing
 * - Provides smooth UX during page transitions
 *
 * @returns JSX.Element | null - Loading overlay or null when not loading
 */
export default function LoadingProvider() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /**
   * Effect to manage loading state based on navigation changes.
   *
   * This effect:
   * - Triggers loading state when pathname or search params change
   * - Implements a minimum loading duration to prevent flickering
   * - Cleans up timers to prevent memory leaks
   * - Provides smooth transitions between loading states
   */
  useEffect(() => {
    // Start loading when navigation begins
    setLoading(true);

    // Stop loading after a short delay to allow page to render
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
