"use client";

import React from "react";

/**
 * Props interface for the BillingProvider context.
 * Manages user billing information including credits and subscription tier.
 */
type BillingProviderProps = {
  /** Current user credits as a string value */
  credits: string;
  /** Current subscription tier (e.g., "free", "pro", "enterprise") */
  tier: string;
  /** Function to update the credits state */
  setCredits: React.Dispatch<React.SetStateAction<string>>;
  /** Function to update the subscription tier state */
  setTier: React.Dispatch<React.SetStateAction<string>>;
};

/**
 * Initial default values for the billing context.
 * Provides fallback values and no-op functions for context initialization.
 */
const initialValues: BillingProviderProps = {
  credits: "",
  setCredits: () => undefined,
  tier: "",
  setTier: () => undefined,
};

/**
 * Props interface for components that accept children.
 */
type WithChildProps = {
  children: React.ReactNode;
};

/** React context for billing-related state management */
const context = React.createContext(initialValues);
const { Provider } = context;

/**
 * BillingProvider component that manages billing-related state across the application.
 *
 * This provider handles:
 * - User credit balance tracking
 * - Subscription tier management
 * - State updates for billing information
 *
 * @param children - Child components that will have access to billing context
 * @returns JSX.Element - Provider wrapper with billing context
 */
export const BillingProvider = ({ children }: WithChildProps) => {
  const [credits, setCredits] = React.useState(initialValues.credits);
  const [tier, setTier] = React.useState(initialValues.tier);

  const values = {
    credits,
    setCredits,
    tier,
    setTier,
  };

  return <Provider value={values}>{children}</Provider>;
};

/**
 * Custom hook to access billing context.
 *
 * @returns BillingProviderProps - The current billing state and setter functions
 * @throws Error if used outside of BillingProvider
 */
export const useBilling = () => {
  const state = React.useContext(context);
  return state;
};
