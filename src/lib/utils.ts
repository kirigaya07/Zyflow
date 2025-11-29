/**
 * Utility Functions Module
 *
 * This module contains common utility functions used throughout the application.
 * Currently includes CSS class name utilities for conditional styling.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines and optimizes CSS class names using clsx and tailwind-merge.
 *
 * This utility function:
 * - Accepts conditional class names via clsx
 * - Merges and deduplicates Tailwind CSS classes via tailwind-merge
 * - Resolves conflicting Tailwind classes (e.g., 'p-4 p-2' becomes 'p-2')
 * - Handles conditional styling patterns
 *
 * @param inputs - Variable number of class values (strings, objects, arrays)
 * @returns Optimized class name string with conflicts resolved
 *
 * @example
 * ```typescript
 * cn('px-2 py-1', condition && 'bg-blue-500', { 'text-white': isActive })
 * // Result: "px-2 py-1 bg-blue-500 text-white" (if condition and isActive are true)
 *
 * cn('p-4', 'p-2')
 * // Result: "p-2" (tailwind-merge resolves the conflict)
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
