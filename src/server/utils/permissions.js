export const permissions = {
  super_admin: ["*"],
  manager: ["dashboard", "borrowers", "equipment", "transactions", "returns"],
  volunteer: ["dashboard", "borrowers", "equipment:view", "transactions:create", "returns:create"],
};
