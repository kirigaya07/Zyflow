/**
 * Loading-Aware Navigation Link Component
 *
 * This component extends Next.js Link with loading state management:
 * - Triggers global loading state on navigation
 * - Provides consistent loading UX across the application
 * - Supports custom click handlers alongside navigation
 * - Maintains full Next.js Link functionality and performance
 *
 * Features:
 * - Automatic loading state activation on click
 * - Custom onClick handler support for additional logic
 * - Full className and styling support
 * - TypeScript-safe props with proper type checking
 * - Integration with global loading provider context
 */

"use client";

import Link from "next/link";
import { useLoading } from "@/providers/loading-provider";
import { ReactNode } from "react";

/**
 * Props interface for the LoadingLink component.
 *
 * @interface LoadingLinkProps
 * @property {string} href - The destination URL for navigation
 * @property {ReactNode} children - Content to display inside the link
 * @property {string} [className] - Optional CSS classes for styling
 * @property {() => void} [onClick] - Optional click handler for additional logic
 */
interface LoadingLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Loading-aware navigation link component that integrates with global loading state.
 *
 * This component provides:
 * - Automatic loading state activation when navigation begins
 * - Seamless integration with the global loading provider
 * - Support for custom click handlers alongside navigation
 * - Full Next.js Link performance and functionality
 *
 * Usage scenarios:
 * - Navigation menu items that should show loading indicators
 * - Dashboard links that require loading feedback
 * - Any navigation that benefits from loading state visualization
 *
 * Loading behavior:
 * - Sets global loading state to true on click
 * - Loading state is managed by the LoadingProvider context
 * - Loading indicators are displayed by the LoadingProvider UI
 * - Loading state is automatically cleared when navigation completes
 *
 * @param href - The destination URL for the navigation link
 * @param children - The content to display inside the link element
 * @param className - Optional CSS classes for link styling
 * @param onClick - Optional callback function for additional click handling
 * @returns JSX.Element - Enhanced Next.js Link with loading state management
 */
export function LoadingLink({
  href,
  children,
  className,
  onClick,
}: LoadingLinkProps) {
  const { setLoading } = useLoading();

  /**
   * Handles link click events with loading state management.
   *
   * This function:
   * - Activates the global loading state for user feedback
   * - Executes any custom onClick handler if provided
   * - Allows Next.js Link to proceed with navigation
   */
  const handleClick = () => {
    setLoading(true);
    if (onClick) onClick();
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
