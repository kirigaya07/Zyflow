"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * Interface for the loading context type.
 * Provides loading state and control functions.
 */
interface LoadingContextType {
  /** Current loading state indicator */
  isLoading: boolean;
  /** Function to manually control loading state */
  setLoading: (loading: boolean) => void;
}

/** React context for loading state management */
const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * Custom hook to access the loading context.
 *
 * @returns LoadingContextType - Loading state and control functions
 * @throws Error if used outside of LoadingProvider
 */
export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}

/**
 * Props interface for the LoadingProvider component.
 */
interface LoadingProviderProps {
  children: ReactNode;
}

/**
 * LoadingProvider component that manages global loading states.
 *
 * This provider handles:
 * - Global loading state management
 * - Automatic loading states during route transitions
 * - Manual loading control for async operations
 * - Loading UI overlay with spinner
 *
 * Features:
 * - Shows loading overlay during navigation
 * - Provides manual loading control via setLoading function
 * - Responsive loading UI with backdrop blur effect
 * - 300ms delay for better user experience
 *
 * @param children - Child components that will have access to loading context
 * @returns JSX.Element - Provider wrapper with loading context and UI
 */
export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  /**
   * Function to manually control loading state.
   * @param loading - Boolean indicating whether to show loading state
   */
  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  // Handle route changes - automatically show loading during navigation
  useEffect(() => {
    setIsLoading(true);

    // Simulate loading time for better UX (prevents flash of loading state)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-200">
          <div className="flex flex-col items-center space-y-4 rounded-lg bg-card p-6 shadow-lg border">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">
              Loading...
            </p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
