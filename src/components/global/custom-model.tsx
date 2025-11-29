/**
 * Custom Modal Component
 *
 * This component provides a reusable modal interface using drawer-style presentation:
 * - Customizable title and subtitle for modal context
 * - Scrollable content area for dynamic content length
 * - Integration with global modal provider for state management
 * - Responsive drawer design optimized for mobile and desktop
 *
 * Features:
 * - Global modal state management through ModelProvider context
 * - Customizable header with title and description
 * - Scrollable content area with overflow handling
 * - Built-in close functionality with confirmation
 * - Responsive design with proper spacing and borders
 * - Accessibility features with proper drawer implementation
 */

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import React from "react";
import { Button } from "../ui/button";
import { useModal } from "@/providers/model-provider";

/**
 * Props interface for the CustomModal component.
 *
 * @interface Props
 * @property {string} title - The main title displayed in the modal header
 * @property {string} subheading - The descriptive subtitle below the title
 * @property {React.ReactNode} children - The content to display in the modal body
 * @property {boolean} [defaultOpen] - Optional default open state (currently unused but available for future functionality)
 */
type Props = {
  title: string;
  subheading: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

/**
 * Custom modal component using drawer-style presentation with global state management.
 *
 * This component provides:
 * - Reusable modal interface with customizable content
 * - Integration with global modal provider for centralized state management
 * - Responsive drawer design that works well on all device sizes
 * - Scrollable content area for handling dynamic content lengths
 * - Built-in close functionality with proper state cleanup
 *
 * Layout structure:
 * - Header: Centered title and description
 * - Body: Scrollable content area with custom children
 * - Footer: Close button with consistent styling
 *
 * State management:
 * - Uses ModelProvider context for open/close state
 * - Automatically handles close events and state cleanup
 * - Responsive to external state changes from other components
 *
 * Design features:
 * - Drawer-style presentation optimized for mobile-first design
 * - Scrollable content area with fixed height and overflow handling
 * - Consistent theming with background and border styling
 * - Proper spacing and typography for readability
 *
 * @param children - The content to display within the modal body
 * @param subheading - Descriptive text displayed below the modal title
 * @param title - The main heading text for the modal
 * @param defaultOpen - Optional default open state for future functionality
 * @returns JSX.Element - Drawer-based modal with customizable content
 */
const CustomModal = ({ children, subheading, title, defaultOpen }: Props) => {
  const { isOpen, setClose } = useModal();

  /**
   * Handles drawer open state changes and triggers modal close when needed.
   *
   * This function:
   * - Responds to drawer close events from user interactions
   * - Calls the global modal provider's setClose function
   * - Ensures proper state synchronization across the application
   *
   * @param open - The new open state of the drawer
   */
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setClose();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-center">{title}</DrawerTitle>
          <DrawerDescription className="text-center">
            {subheading}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col items-center gap-4 h-96 overflow-scroll px-4">
          {children}
        </div>
        <DrawerFooter className="flex flex-col gap-4 bg-background border-t-[1px] border-t-muted">
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CustomModal;
