"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

/**
 * Props interface for the ModalProvider component.
 */
interface ModalProviderProps {
  children: React.ReactNode;
}

/**
 * Type definition for modal data.
 * Allows flexible data structure for different modal types.
 */
export type ModalData = Record<string, unknown>;

/**
 * Modal context type interface defining available modal operations.
 * Provides modal state management and control functions.
 */
type ModalContextType = {
  /** Current modal data/props */
  data: ModalData;
  /** Whether a modal is currently open */
  isOpen: boolean;
  /** Function to open a modal with optional data fetching */
  setOpen: (
    modal: React.ReactNode,
    fetchData?: () => Promise<ModalData>
  ) => void;
  /** Function to close the current modal */
  setClose: () => void;
};

/** React context for modal state management */
export const ModalContext = createContext<ModalContextType | null>(null);

/**
 * ModalProvider component that manages modal state and rendering.
 *
 * This provider handles:
 * - Modal open/close state management
 * - Modal data fetching and storage
 * - Modal component rendering
 * - Hydration-safe modal mounting
 * - Error handling for data fetching operations
 *
 * Features:
 * - Supports async data fetching before modal opens
 * - Prevents hydration mismatches with client-side mounting
 * - Automatic data cleanup on modal close
 * - Error-safe data fetching with fallback to empty data
 *
 * @param children - Child components that will have access to modal context
 * @returns JSX.Element - Provider wrapper with modal context and rendering
 */
const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ModalData>({});
  const [showingModal, setShowingModal] = useState<React.ReactNode>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted on client-side to prevent hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * Function to open a modal with optional data fetching.
   *
   * @param modal - React component/element to render as modal
   * @param fetchData - Optional async function to fetch modal data
   */
  const setOpen = useCallback(
    async (modal: React.ReactNode, fetchData?: () => Promise<ModalData>) => {
      if (modal) {
        if (fetchData) {
          try {
            const fetchedData = await fetchData();
            setData((prevData) => ({ ...prevData, ...fetchedData }));
          } catch (error) {
            console.error("Error fetching modal data:", error);
            // Set empty data on error to prevent breaking the modal
            setData({});
          }
        }
        setShowingModal(modal);
        setIsOpen(true);
      }
    },
    []
  );

  /**
   * Function to close the current modal and clean up state.
   * Resets modal data, visibility, and content.
   */
  const setClose = useCallback(() => {
    setIsOpen(false);
    setData({});
    setShowingModal(null);
  }, []);

  if (!isMounted) return null;

  return (
    <ModalContext.Provider value={{ data, setOpen, setClose, isOpen }}>
      {children}
      {showingModal}
    </ModalContext.Provider>
  );
};

/**
 * Custom hook to access the modal context.
 *
 * @returns ModalContextType - Modal state and control functions
 * @throws Error if used outside of ModalProvider
 */
export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within the modal provider");
  }
  return context;
};

export default ModalProvider;
