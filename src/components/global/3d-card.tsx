/**
 * 3D Card Animation Components
 *
 * This module provides interactive 3D card effects with mouse tracking:
 * - Mouse-driven 3D rotation animations
 * - Context-based hover state management
 * - Perspective effects and depth illusions
 * - Customizable card content with layered elements
 *
 * Features:
 * - Real-time mouse position tracking for 3D transformations
 * - Smooth rotation animations based on cursor position
 * - Context provider for sharing hover state across components
 * - Perspective effects with translateZ transformations
 * - Responsive design with proper transform origins
 * - Performance-optimized animations with CSS transforms
 */

"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
} from "react";

/**
 * Context for sharing mouse hover state across 3D card components.
 * Provides access to mouse enter/leave state for coordinated animations.
 */
const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined);

/**
 * 3D card container component with mouse-driven rotation animations.
 *
 * This component provides:
 * - Interactive 3D rotation based on mouse position
 * - Perspective transformations for depth effects
 * - Context provider for child component hover state coordination
 * - Smooth transitions and animation performance optimization
 *
 * Animation behavior:
 * - Calculates rotation angles based on mouse position relative to card center
 * - Applies rotateY and rotateX transformations for 3D effect
 * - Resets to neutral position when mouse leaves the card
 * - Provides smooth transitions with CSS transform properties
 *
 * @param children - Child components to render within the 3D card container
 * @param className - Additional CSS classes for the card content
 * @param containerClassName - CSS classes for the outer container wrapper
 * @returns JSX.Element - Interactive 3D card container with mouse tracking
 */
export const CardContainer = ({
  children,
  className,
  containerClassName,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  /**
   * Handles mouse movement for real-time 3D rotation calculations.
   *
   * This function:
   * - Calculates mouse position relative to card center
   * - Converts position to rotation angles for 3D effect
   * - Applies CSS transforms for smooth rotation animations
   * - Uses perspective calculations for realistic 3D appearance
   */
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
  };

  /**
   * Handles mouse enter events for hover state activation.
   * Sets the global hover state for coordinated child component animations.
   */
  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsMouseEntered(true);
    if (!containerRef.current) return;
  };

  /**
   * Handles mouse leave events for hover state deactivation.
   * Resets the card rotation to neutral position and clears hover state.
   */
  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsMouseEntered(false);
    containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`;
  };
  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={cn("flex items-center justify-center", containerClassName)}
        style={{
          perspective: "1000px",
        }}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "flex items-center justify-center relative transition-all duration-200 ease-linear",
            className
          )}
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
};

export const CardBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "h-96 w-96 [transform-style:preserve-3d]  [&>*]:[transform-style:preserve-3d]",
        className
      )}
    >
      {children}
    </div>
  );
};

export const CardItem = ({
  as: Tag = "div",
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: {
  as?: React.ElementType;
  children: React.ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMouseEntered] = useMouseEnter();

  useEffect(() => {
    handleAnimations();
  }, [isMouseEntered]);

  const handleAnimations = () => {
    if (!ref.current) return;
    if (isMouseEntered) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    } else {
      ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
    }
  };

  return (
    <Tag
      ref={ref}
      className={cn("w-fit transition duration-200 ease-linear", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
};

// Create a hook to use the context
export const useMouseEnter = () => {
  const context = useContext(MouseEnterContext);
  if (context === undefined) {
    throw new Error("useMouseEnter must be used within a MouseEnterProvider");
  }
  return context;
};
