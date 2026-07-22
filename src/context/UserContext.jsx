"use client";

import { createContext, useContext } from "react";

export const UserContext = createContext(null);

export function useUsers() {
  return useContext(UserContext);
}
