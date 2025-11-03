"use client";

import Link from "next/link";
import { useLoading } from "@/providers/loading-provider";
import { ReactNode } from "react";

interface LoadingLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function LoadingLink({
  href,
  children,
  className,
  onClick,
}: LoadingLinkProps) {
  const { setLoading } = useLoading();

  const handleClick = () => {
    setLoading(true);
    if (onClick) onClick();
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
