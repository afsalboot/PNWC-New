export function generateInventoryCode(nextNumber) {
  return `PNWC-${String(nextNumber).padStart(5, "0")}`;
}
