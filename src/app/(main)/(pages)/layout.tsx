import React from "react";

type Props = { children: React.ReactNode };

const Layout = ({ children }: Props) => {
  return (
    <div className="md:border-l-[1px] md:border-t-[1px] pb-20 h-screen md:rounded-l-3xl border-muted-foreground/20 overflow-scroll">
      {children}
    </div>
  );
};

export default Layout;
