/**
 * Infinite Moving Cards Component
 *
 * This component creates a smooth infinite scrolling carousel of cards:
 * - Seamless looping animation with duplicated content
 * - Configurable speed and direction controls
 * - Hover pause functionality for user interaction
 * - CSS animation-based scrolling for optimal performance
 *
 * Features:
 * - Horizontal infinite scrolling with smooth transitions
 * - Dynamic content duplication for seamless looping
 * - Multiple speed options (fast, normal, slow)
 * - Bidirectional scrolling (left or right)
 * - Pause on hover for better user experience
 * - Responsive design with flexible card sizing
 */

"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";

/**
 * Infinite moving cards component with configurable animation options.
 *
 * This component provides:
 * - Smooth infinite scrolling animation of card items
 * - Content duplication for seamless loop transitions
 * - Configurable animation speed and direction
 * - Hover interactions with pause functionality
 * - CSS-based animations for optimal performance
 *
 * Animation behavior:
 * - Duplicates content to create seamless infinite loop
 * - Uses CSS custom properties for dynamic animation control
 * - Supports multiple speed presets and directions
 * - Automatically pauses on hover when enabled
 *
 * Performance optimizations:
 * - CSS animations instead of JavaScript for smoother performance
 * - Content duplication occurs once during initialization
 * - GPU-accelerated transforms for smooth scrolling
 *
 * @param items - Array of items with href properties for card content
 * @param direction - Scroll direction: "left" (default) or "right"
 * @param speed - Animation speed: "fast" (default), "normal", or "slow"
 * @param pauseOnHover - Whether to pause animation on hover (default: true)
 * @param className - Additional CSS classes for container styling
 * @returns JSX.Element - Infinite scrolling cards container
 */
export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: {
    href: string;
  }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, []);

  const [start, setStart] = useState(false);

  /**
   * Initializes the infinite scrolling animation by duplicating content.
   *
   * This function:
   * - Clones all existing card items to create seamless looping
   * - Configures animation direction and speed via CSS properties
   * - Activates the animation state for rendering
   * - Ensures smooth infinite scrolling without visible breaks
   */
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };
  console.log(items);
  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20  max-w-7xl overflow-hidden  [mask-image:linear-gradient(to_right,transparent,white_20%,white_80%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          " flex min-w-full shrink-0 gap-10 py-4 w-max flex-nowrap",
          start && "animate-scroll ",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, _idx) => (
          <Image
            width={170}
            height={1}
            src={item.href}
            alt={item.href}
            className=" relative rounded-2xl  object-contain opacity-50"
            key={item.href}
          />
        ))}
      </ul>
    </div>
  );
};
