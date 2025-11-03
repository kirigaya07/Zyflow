import Image from "next/image";
import React from "react";
import { MenuIcon } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { LoadingLink } from "./loading-link";

const Navbar = async () => {
  const user = await currentUser();
  return (
    <header className="fixed right-0 left-0 top-0 py-4 px-4 bg-black/40 backdrop-blur-lg z-[100] flex items-center border-b-[1px] border-neutral-900 justify-between">
      <aside className="flex items-center gap-[2px]">
        <p className="text-3xl font-bold">Z</p>
        <Image
          src="/fuzzieLogo.png"
          width={15}
          height={15}
          alt="fuzzie logo"
          className="shadow-sm"
        />
        <p className="text-3xl font-bold">Flow</p>
      </aside>
      <nav
        className="absolute left-[50%] top-[50%] transform translate-x-[-50%] translate-y-[-50%] hidden md:block"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="flex items-center gap-4 list-none">
          <li>
            <LoadingLink
              href="/products"
              className="hover:text-blue-400 transition-colors"
            >
              Products
            </LoadingLink>
          </li>
          <li>
            <LoadingLink
              href="/pricing"
              className="hover:text-blue-400 transition-colors"
            >
              Pricing
            </LoadingLink>
          </li>
          {/* <li>
            <Link
              href="/clients"
              className="hover:text-blue-400 transition-colors"
            >
              Clients
            </Link>
          </li> */}
          {/* <li>
            <Link
              href="/resources"
              className="hover:text-blue-400 transition-colors"
            >
              Resources
            </Link>
          </li> */}
          <li>
            <LoadingLink
              href="/docs"
              className="hover:text-blue-400 transition-colors"
            >
              Documentation
            </LoadingLink>
          </li>
          <li>
            <LoadingLink
              href="/enterprise"
              className="hover:text-blue-400 transition-colors"
            >
              Enterprise
            </LoadingLink>
          </li>
        </ul>
      </nav>
      <aside className="flex items-center gap-4">
        <LoadingLink
          href="/dashboard"
          className="relative inline-flex h-10 overflow-hidden rounded-full p-[2px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
          <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
            {user ? "Dashboard" : "Get Started"}
          </span>
        </LoadingLink>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {user.firstName ||
                user.emailAddresses?.[0]?.emailAddress ||
                "User"}
            </span>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                  userButtonPopover: "z-[200]",
                },
              }}
            />
          </div>
        ) : (
          <div className="text-xs text-gray-500">Not logged in</div>
        )}
        <button className="md:hidden" aria-label="Open mobile menu">
          <MenuIcon className="h-6 w-6" />
        </button>
      </aside>
    </header>
  );
};

export default Navbar;
