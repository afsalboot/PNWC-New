"use client";

import { createContext, useContext } from "react";

export const BorrowerContext = createContext(null);

export function useBorrowers() {
  return useContext(BorrowerContext);
}
