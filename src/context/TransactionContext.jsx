"use client";

import { createContext, useContext } from "react";

export const TransactionContext = createContext(null);

export function useTransactions() {
  return useContext(TransactionContext);
}
