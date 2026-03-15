"use client";

import { useBilling } from "@/providers/billing-provider";
import React from "react";
import CreditTracker from "./creadits-tracker";

const BillingDashboard = () => {
  const { credits, tier } = useBilling();

  return (
    <>
      <div className="flex flex-col gap-4 p-6">
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
          Payments are coming soon. Stay tuned!
        </div>
        <CreditTracker tier={tier} credits={parseInt(credits)} />
      </div>
    </>
  );
};

export default BillingDashboard;
