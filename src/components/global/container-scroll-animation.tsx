"use client";
import React, { useRef } from "react";
import { useScroll, useTransform, motion } from "framer-motion";
import Image from "next/image";

export const ContainerScroll = ({
  titleComponent,
}: {
  titleComponent: string | React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Starts tilted & small, flattens & grows as you scroll down — satisfying "landing" feel
  const rotate   = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale    = useTransform(scrollYProgress, [0, 1], isMobile ? [0.75, 1] : [0.82, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -80]);

  return (
    <div
      className="h-[75rem] flex items-center justify-center relative p-10 md:p-20"
      ref={containerRef}
    >
      <div className="py-40 w-full relative" style={{ perspective: "1200px" }}>
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale} />
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: { translate: any; titleComponent: React.ReactNode }) => (
  <motion.div
    style={{ translateY: translate }}
    className="max-w-5xl mx-auto text-center"
  >
    {titleComponent}
  </motion.div>
);

export const Card = ({ rotate, scale }: { rotate: any; scale: any; translate: any }) => (
  <motion.div
    style={{
      rotateX: rotate,
      scale,
      // Crisp layered shadow — no color leak
      boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 24px 48px rgba(0,0,0,0.5), 0 8px 16px rgba(0,0,0,0.3)",
    }}
    className="max-w-5xl -mt-10 mx-auto h-[28rem] md:h-[40rem] w-full rounded-2xl bg-neutral-900 border border-white/[0.07] overflow-hidden"
  >
    {/* Thin chrome bar — mimics browser/app window */}
    <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.06] bg-neutral-950/60">
      <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
      <div className="flex-1 mx-4 h-5 rounded bg-white/[0.04] border border-white/[0.06]" />
    </div>
    {/* Screenshot */}
    <div className="relative h-full w-full">
      <Image
        src="/temp-banner.png"
        fill
        alt="Zyflow dashboard"
        className="object-cover object-top"
        priority
      />
    </div>
  </motion.div>
);
