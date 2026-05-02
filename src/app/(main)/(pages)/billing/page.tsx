import React from "react";
import BillingDashboard from "./_components/billing-dashboard";

type Props = {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
};

const Billing = async (_props: Props) => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 px-4 py-4 md:px-6 md:py-5 text-2xl md:text-4xl backdrop-blur-lg">
        <span>Billing</span>
      </h1>
      <BillingDashboard />
    </div>
  );
};

export default Billing;
