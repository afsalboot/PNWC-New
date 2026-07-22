"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FaArrowLeft, FaCircleCheck, FaFileImport, FaTriangleExclamation } from "react-icons/fa6";
import { api } from "@/components/app/constants";
import {
  equipmentImportFields,
  equipmentImportStorageKey,
  mapRowToEquipment,
} from "@/components/app/bulkEquipmentImport";
import { AppLayout, Field } from "@/components/app/ui";

export default function EquipmentImportPage() {
  const [storedImportData] = useState(() => readStoredImportData());
  const [search, setSearch] = useState("");
  const [importData] = useState(storedImportData);
  const [mapping, setMapping] = useState(storedImportData?.mapping || {});
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const mappedRows = useMemo(() => {
    if (!importData?.rows?.length) return [];
    return importData.rows.map((row) => mapRowToEquipment(row, mapping));
  }, [importData, mapping]);
  const validRows = mappedRows.filter((row) => row.name);
  const successCount = results.filter((result) => result.ok).length;
  const failedCount = results.filter((result) => !result.ok).length;

  function updateMapping(field, value) {
    setMapping((current) => ({ ...current, [field]: value }));
  }

  async function importEquipment() {
    setResults([]);
    setMessage("");
    setStatus("importing");

    const importResults = [];
    for (const row of validRows) {
      try {
        await api("/api/equipment", {
          method: "POST",
          body: JSON.stringify(row),
        });
        importResults.push({ ok: true, name: row.name });
      } catch (error) {
        importResults.push({ ok: false, name: row.name || "Unnamed equipment", message: error.message || "Import failed" });
      }
      setResults([...importResults]);
    }

    const failed = importResults.filter((result) => !result.ok).length;
    setStatus(failed ? "failed" : "success");
    setMessage(failed ? `${importResults.length - failed} imported, ${failed} failed.` : `${importResults.length} equipment items imported.`);
    if (!failed) {
      sessionStorage.removeItem(equipmentImportStorageKey);
    }
  }

  return (
    <AppLayout activeView="Equipment" search={search} onSearch={setSearch} loading={false} message={message}>
      <div className="actionHeader">
        <div className="sectionTitle">
          <div>
            <span className="eyebrow">Bulk import</span>
            <h2>Field mapping</h2>
          </div>
        </div>
        <Link className="secondaryButton" href="/equipment"><FaArrowLeft /> <span>Back</span></Link>
      </div>

      {!importData ? (
        <section className="glass panel">
          <p className="emptyText">Upload an equipment file before mapping fields.</p>
          <Link className="primaryButton" href="/equipment">Go to Equipment</Link>
        </section>
      ) : (
        <>
          <section className="glass panel">
            <div className="bulkImportStatus ready">
              <FaFileImport />
              <span>{importData.fileName} - {importData.rows.length} rows detected.</span>
            </div>
            <div className="mappingGrid">
              {equipmentImportFields.map((field) => (
                <Field
                  key={field.key}
                  label={`${field.label}${field.required ? " *" : ""}`}
                  value={mapping[field.key] || ""}
                  onChange={(value) => updateMapping(field.key, value)}
                  options={["", ...importData.headers]}
                  required={field.required}
                />
              ))}
            </div>
          </section>

          <section className="glass panel">
            <div className="sectionTitle">
              <div>
                <span className="eyebrow">Preview</span>
                <h2>{validRows.length} valid rows</h2>
              </div>
            </div>
            <div className="bulkPreview">
              {mappedRows.slice(0, 8).map((row, index) => (
                <article key={`${row.code || row.name || "row"}-${index}`} className={!row.name ? "invalidRow" : ""}>
                  <b>{row.name || "Missing equipment name"}</b>
                  <span>{row.category || "Uncategorized"} - {row.totalStock} total / {row.availableStock} available</span>
                </article>
              ))}
            </div>
            <button type="button" className="primaryButton" disabled={!validRows.length || status === "importing"} onClick={importEquipment}>
              {status === "importing" ? "Importing..." : "Import Mapped Equipment"}
            </button>
          </section>

          {status !== "idle" && (
            <section className="glass panel">
              <div className={`bulkImportStatus ${status}`}>
                {status === "importing" && <span>Importing equipment...</span>}
                {status === "success" && <><FaCircleCheck /><span>{successCount} equipment items imported successfully.</span></>}
                {status === "failed" && <><FaTriangleExclamation /><span>{successCount} imported, {failedCount} failed.</span></>}
              </div>
              {failedCount > 0 && (
                <div className="bulkFailures">
                  {results.filter((result) => !result.ok).map((result, index) => (
                    <span key={`${result.name}-${index}`}>{result.name}: {result.message}</span>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </AppLayout>
  );
}

function readStoredImportData() {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(equipmentImportStorageKey);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}
