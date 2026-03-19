"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}: {
  items: { href: string }[];
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef  = React.useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;

    // Duplicate items for seamless loop
    Array.from(scrollerRef.current.children).forEach((item) => {
      scrollerRef.current!.appendChild(item.cloneNode(true));
    });

    // Direction
    containerRef.current.style.setProperty(
      "--animation-direction",
      direction === "left" ? "forwards" : "reverse"
    );

    // Speed
    const durations = { fast: "25s", normal: "45s", slow: "70s" };
    containerRef.current.style.setProperty(
      "--animation-duration",
      durations[speed]
    );

    setStart(true);
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      // CSS mask: black=visible, transparent=hidden — correct for any bg color
      className={cn(
        "scroller relative z-20 max-w-6xl overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-12 py-3 w-max flex-nowrap",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item) => (
          <li
            key={item.href}
            className="relative flex-shrink-0 group"
          >
            <Image
              width={140}
              height={50}
              src={item.href}
              alt={item.href}
              className="object-contain h-10 w-auto opacity-40 grayscale group-hover:opacity-80 group-hover:grayscale-0 transition-all duration-500"
            />
          </li>
        ))}
      </ul>
    </div>
  );
};
