"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

interface ModalProviderProps {
  children: React.ReactNode;
}

// More specific type for modal data
export type ModalData = Record<string, unknown>;

type ModalContextType = {
  data: ModalData;
  isOpen: boolean;
  setOpen: (
    modal: React.ReactNode,
    fetchData?: () => Promise<ModalData>
  ) => void;
  setClose: () => void;
};

export const ModalContext = createContext<ModalContextType | null>(null);

const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<ModalData>({});
  const [showingModal, setShowingModal] = useState<React.ReactNode>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within the modal provider");
  }
  return context;
};

export default ModalProvider;
