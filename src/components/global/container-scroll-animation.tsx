/**
 * Container Scroll Animation Component
 *
 * This component creates engaging scroll-triggered animations for showcasing content:
 * - Scroll-based transformations using Framer Motion
 * - Responsive design with mobile-specific adjustments
 * - 3D perspective effects with rotation and scaling
 * - Smooth transitions tied to scroll progress
 *
 * Features:
 * - Scroll progress tracking for animation triggers
 * - Mobile-responsive scaling and transform adjustments
 * - 3D perspective container with depth effects
 * - Coordinated header and card animations
 * - Performance-optimized with useTransform hooks
 * - Smooth easing and natural motion curves
 */

"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import Image from "next/image";

/**
 * Main container scroll animation component with responsive 3D effects.
 *
 * This component provides:
 * - Scroll-triggered animations for immersive content presentation
 * - Responsive behavior with mobile-specific transform values
 * - 3D perspective container for depth and dimension effects
 * - Coordinated animations between header text and card content
 *
 * Animation behavior:
 * - Tracks scroll progress within the container viewport
 * - Applies rotation, scaling, and translation transforms
 * - Adjusts animation parameters based on device type
 * - Creates smooth transitions tied to user scroll behavior
 *
 * Responsive features:
 * - Dynamic mobile detection with resize event handling
 * - Mobile-optimized scaling factors for better UX
 * - Viewport-aware animation adjustments
 *
 * @param titleComponent - Header content (string or React component) to animate
 * @returns JSX.Element - Scroll-animated container with 3D effects
 */
export const ContainerScroll = ({
  titleComponent,
}: {
  titleComponent: string | React.ReactNode;
}) => {
  const containerRef = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  /**
   * Effect to handle responsive mobile detection and window resize events.
   * Updates mobile state for responsive animation adjustments.
   */
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  /**
   * Returns responsive scaling dimensions based on device type.
   * Mobile devices use smaller scale factors for better visual proportions.
   */
  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  // Transform values based on scroll progress
  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div
      className="h-[80rem] flex items-center justify-center relative p-20"
      ref={containerRef}
    >
      <div
        className="py-40 w-full relative"
        style={{
          perspective: "1000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale} />
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  translate,
}: {
  rotate: any;
  scale: any;
  translate: any;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate, // rotate in X-axis
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-5xl -mt-12 mx-auto h-[30rem] md:h-[40rem] w-full  p-6 bg-[#222222] rounded-[30px] shadow-2xl"
    >
      <div className="bg-gray-100 h-full w-full rounded-2xl  gap-4 overflow-hidden p-4 transition-all ">
        <Image
          src="/temp-banner.png"
          fill
          alt="bannerImage"
          className="object-cover border-8 rounded-2xl"
        />
      </div>
    </motion.div>
  );
};
