import InfoBar from "@/components/infobar";
import Sidebar from "@/components/sidebar";
import MobileNav from "@/components/mobile-nav";
import React from "react";

type Props = { children: React.ReactNode };

const Layout = ({ children }: Props) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <InfoBar />
        <main className="flex-1 overflow-auto min-h-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

export default Layout;
