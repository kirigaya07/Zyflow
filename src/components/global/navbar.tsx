"use server";

import React from "react";
import { Zap } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { LoadingLink } from "./loading-link";

const Navbar = async () => {
  const user = await currentUser();

  return (
    <header className="fixed inset-x-0 top-0 z-[100] h-14 flex items-center border-b border-white/[0.06] bg-black/60 backdrop-blur-md px-6">
      {/* Brand */}
      <LoadingLink href="/" className="flex items-center gap-2 shrink-0">
        <div className="h-6 w-6 rounded-md bg-indigo-600 flex items-center justify-center">
          <Zap className="h-3.5 w-3.5 text-white fill-white" />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">Zyflow</span>
      </LoadingLink>

      {/* Nav links — centered */}
      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-6">
        {[
          { label: "Features", href: "#features" },
          { label: "How it works", href: "#how-it-works" },
          { label: "Pricing", href: "#pricing" },
        ].map(({ label, href }) => (
          <a
            key={href}
            href={href}
            className="text-xs text-neutral-400 hover:text-white transition-colors"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <>
            <LoadingLink
              href="/dashboard"
              className="h-7 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors inline-flex items-center"
            >
              Dashboard
            </LoadingLink>
            <UserButton
              afterSignOutUrl="/"
              appearance={{ elements: { avatarBox: "w-7 h-7" } }}
            />
          </>
        ) : (
          <>
            <LoadingLink
              href="/sign-in"
              className="text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Sign in
            </LoadingLink>
            <LoadingLink
              href="/sign-up"
              className="h-7 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors inline-flex items-center"
            >
              Get started
            </LoadingLink>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
