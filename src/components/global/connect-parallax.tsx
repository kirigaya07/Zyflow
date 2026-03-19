"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import Image from "next/image";
import { LoadingLink } from "./loading-link";

export const HeroParallax = ({
  products,
}: {
  products: { title: string; link: string; thumbnail: string }[];
}) => {
  const firstRow  = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow  = products.slice(10, 15);
  const ref = React.useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Smooth, intentional spring — no bounce. Apple-caliber feel.
  const spring = { stiffness: 80, damping: 40, restDelta: 0.001 };

  const translateX        = useSpring(useTransform(scrollYProgress, [0, 1], [0,  800]), spring);
  const translateXReverse = useSpring(useTransform(scrollYProgress, [0, 1], [0, -800]), spring);
  const rotateX  = useSpring(useTransform(scrollYProgress, [0, 0.25], [14, 0]),  spring);
  const opacity  = useSpring(useTransform(scrollYProgress, [0, 0.25], [0.15, 1]), spring);
  const rotateZ  = useSpring(useTransform(scrollYProgress, [0, 0.25], [14, 0]),  spring);
  const translateY = useSpring(useTransform(scrollYProgress, [0, 0.25], [-500, 350]), spring);

  return (
    <div
      ref={ref}
      className="h-[280vh] py-32 overflow-hidden antialiased relative flex flex-col [perspective:1000px] [transform-style:preserve-3d]"
    >
      <Header />
      <motion.div
        style={{ rotateX, rotateZ, translateY, opacity }}
        className="will-change-transform"
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-16 mb-16">
          {firstRow.map((product) => (
            <ProductCard key={product.title} product={product} translate={translateX} />
          ))}
        </motion.div>
        <motion.div className="flex flex-row space-x-16 mb-16">
          {secondRow.map((product) => (
            <ProductCard key={product.title} product={product} translate={translateXReverse} />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-16">
          {thirdRow.map((product) => (
            <ProductCard key={product.title} product={product} translate={translateX} />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Header = () => (
  <div className="max-w-5xl relative mx-auto py-20 md:py-32 px-6 w-full">
    <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 mb-4">
      Workflow gallery
    </p>
    <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight leading-tight">
      Build any automation <br className="hidden md:block" /> you can imagine
    </h2>
    <p className="max-w-xl text-base text-neutral-400 mt-5 leading-relaxed">
      From simple two-step notifications to complex multi-branch pipelines with
      AI, code, and conditional logic — Zyflow handles it all visually.
    </p>
  </div>
);

export const ProductCard = ({
  product,
  translate,
}: {
  product: { title: string; link: string; thumbnail: string };
  translate: MotionValue<number>;
}) => (
  <motion.div
    style={{ x: translate }}
    whileHover={{ y: -12 }}
    transition={{ duration: 0.3, ease: [0.32, 0, 0.67, 0] }}
    className="group/product h-80 w-[26rem] relative flex-shrink-0 rounded-xl overflow-hidden border border-white/[0.07] will-change-transform"
  >
    <LoadingLink href={product.link} className="block h-full w-full">
      <Image
        src={product.thumbnail}
        height={600}
        width={600}
        className="object-cover object-left-top h-full w-full"
        alt={product.title}
      />
    </LoadingLink>
    {/* Hover overlay — smooth gradient, not hard black */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/product:opacity-100 transition-opacity duration-300 pointer-events-none" />
    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover/product:translate-y-0 group-hover/product:opacity-100 transition-all duration-300">
      <p className="text-white text-sm font-semibold">{product.title}</p>
      <p className="text-white/60 text-xs mt-0.5">View template →</p>
    </div>
  </motion.div>
);
