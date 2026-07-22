export const views = [
  { label: "Home", href: "/dashboard", icon: "dashboard" },
  { label: "Transactions", href: "/transactions", icon: "transactions" },
  { label: "Borrowers", href: "/borrowers", icon: "borrowers" },
  { label: "Equipment", href: "/equipment", icon: "equipment" },
  { label: "Returns", href: "/returns", icon: "returns" },
  { label: "Profile", href: "/profile", icon: "profile" },
  { label: "Users", href: "/users", icon: "users", roles: ["super_admin"] },
];

export const categories = [
  "Wheelchair",
  "Hospital Bed",
  "Walker",
  "Crutches",
  "Oxygen Concentrator",
  "Nebulizer",
  "Air Mattress",
  "Suction Machine",
  "Monitor",
  "Other",
];

export const conditions = ["Excellent", "Good", "Fair", "Repair Needed"];

export const emptyBorrower = {
  name: "",
  code: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  notes: "",
};

export const emptyEquipment = {
  name: "",
  code: "",
  category: "Wheelchair",
  totalStock: 1,
  availableStock: 1,
  condition: "Good",
  status: "Available",
  description: "",
  image: "",
};

export const emptyTransaction = {
  borrowerId: "",
  equipmentId: "",
  quantity: 1,
  issuedBy: "",
  notes: "",
};

export async function api(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function uploadImage(file, folder) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Upload failed");
  }
  return data.url;
}

export function filterRows(rows, term, keys) {
  const value = term.trim().toLowerCase();
  if (!value) return rows;
  return rows.filter((row) => keys.some((key) => String(row[key] || "").toLowerCase().includes(value)));
}

export function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}
