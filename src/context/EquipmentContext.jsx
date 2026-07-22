"use client";

import { createContext, useContext } from "react";

export const EquipmentContext = createContext(null);

export function useEquipment() {
  return useContext(EquipmentContext);
}
