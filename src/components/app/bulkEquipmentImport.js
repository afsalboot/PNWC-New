import * as XLSX from "xlsx";
import { categories, conditions } from "./constants";

export const equipmentImportStorageKey = "pnwcBulkEquipmentImport";

export const equipmentImportFields = [
  { key: "name", label: "Equipment Name", required: true },
  { key: "code", label: "Code" },
  { key: "category", label: "Category" },
  { key: "totalStock", label: "Total Stock" },
  { key: "availableStock", label: "Available Stock" },
  { key: "condition", label: "Condition" },
  { key: "status", label: "Status" },
  { key: "description", label: "Description" },
];

// Keep the downloadable templates aligned with the Add Equipment modal. Image
// is intentionally omitted because file/image uploads are not spreadsheet data.
export const equipmentTemplateFields = [
  "name",
  "code",
  "category",
  "totalStock",
  "availableStock",
  "condition",
  "status",
  "description",
];

export const sampleRows = [
  {
    name: "Wheelchair Standard",
    code: "PNWC-01001",
    category: "Wheelchair",
    totalStock: 5,
    availableStock: 5,
    condition: "Good",
    status: "Available",
    description: "Foldable wheelchair",
  },
  {
    name: "Hospital Bed",
    code: "PNWC-01002",
    category: "Hospital Bed",
    totalStock: 2,
    availableStock: 2,
    condition: "Excellent",
    status: "Available",
    description: "Manual adjustable bed",
  },
];

export function autoMapHeaders(headers) {
  return equipmentImportFields.reduce((mapping, field) => {
    const normalizedField = normalizeKey(field.key);
    const header = headers.find((item) => normalizeKey(item) === normalizedField || normalizeKey(item) === normalizeKey(field.label));
    return { ...mapping, [field.key]: header || "" };
  }, {});
}

export function parseWorkbookRows(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

export function mapRowToEquipment(row, mapping) {
  const valueFor = (key) => row[mapping[key]] ?? "";
  const totalStock = toPositiveNumber(valueFor("totalStock"), 1);
  const availableStock = toPositiveNumber(valueFor("availableStock"), totalStock);
  const category = pickAllowed(valueFor("category"), categories, valueFor("category") || "Other");
  const condition = pickAllowed(valueFor("condition"), conditions, "Good");

  return {
    name: String(valueFor("name")).trim(),
    code: String(valueFor("code")).trim(),
    category,
    totalStock,
    availableStock: Math.min(availableStock, totalStock),
    condition,
    status: String(valueFor("status") || "Available").trim() || "Available",
    description: String(valueFor("description")).trim(),
    model: String(valueFor("model")).trim(),
    serialNumber: String(valueFor("serialNumber")).trim(),
    location: String(valueFor("location")).trim(),
    donationDate: formatDateValue(valueFor("donationDate")),
    donorName: String(valueFor("donorName")).trim(),
  };
}

export function createSampleCsv() {
  return XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(sampleRows, { header: equipmentTemplateFields }));
}

export function createSampleExcelBlob() {
  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: equipmentTemplateFields });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment");
  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function normalizeKey(key) {
  return String(key).trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toPositiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function pickAllowed(value, allowedValues, fallback) {
  const match = allowedValues.find((allowed) => allowed.toLowerCase() === String(value || "").trim().toLowerCase());
  return match || fallback;
}

function formatDateValue(value) {
  if (!value) return "";
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return "";
    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  return String(value).trim();
}
