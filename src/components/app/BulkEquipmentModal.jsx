"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowRight, FaDownload, FaFileArrowUp, FaTriangleExclamation } from "react-icons/fa6";
import * as XLSX from "xlsx";
import {
  autoMapHeaders,
  createSampleCsv,
  createSampleExcelBlob,
  equipmentImportStorageKey,
  parseWorkbookRows,
} from "./bulkEquipmentImport";
import { Modal } from "./ui";

export function BulkEquipmentModal({ onClose }) {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function parseFile(file) {
    if (!file) return;
    setFileName(file.name);
    setRowCount(0);
    setError("");
    setStatus("reading");

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const { headers, rows } = parseWorkbookRows(workbook);
      if (!rows.length) {
        throw new Error("No equipment rows found in this file.");
      }
      sessionStorage.setItem(equipmentImportStorageKey, JSON.stringify({
        fileName: file.name,
        headers,
        rows,
        mapping: autoMapHeaders(headers),
      }));
      setRowCount(rows.length);
      setStatus("ready");
    } catch (parseError) {
      setStatus("failed");
      setError(parseError.message || "Unable to read this file.");
    }
  }

  function goToMapping() {
    onClose();
    router.push("/equipment/import");
  }

  function downloadSampleCsv() {
    downloadFile(new Blob([createSampleCsv()], { type: "text/csv;charset=utf-8" }), "pnwc-equipment-sample.csv");
  }

  function downloadSampleExcel() {
    downloadFile(createSampleExcelBlob(), "pnwc-equipment-sample.xlsx");
  }

  return (
    <Modal title="Bulk Add Equipment" eyebrow="Equipment module" onClose={onClose}>
      <div className="bulkImportPanel">
        <div className={`bulkUploadDrop ${status === "reading" ? "isWorking" : ""}`}>
          <FaFileArrowUp />
          <strong>{fileName || "Upload CSV or Excel file"}</strong>
          <p>After upload, continue to field mapping so each file column matches the equipment fields.</p>
          <input type="file" accept=".csv,.xls,.xlsx" onChange={(event) => parseFile(event.target.files?.[0])} />
        </div>

        <div className="bulkTemplateActions">
          <button type="button" className="secondaryButton" onClick={downloadSampleCsv}>
            <FaDownload />
            <span>Sample CSV</span>
          </button>
          <button type="button" className="secondaryButton" onClick={downloadSampleExcel}>
            <FaDownload />
            <span>Sample Excel</span>
          </button>
        </div>

        <div className={`bulkImportStatus ${status}`}>
          {status === "idle" && <span>Upload a file or download a sample template.</span>}
          {status === "reading" && <span>Reading file...</span>}
          {status === "ready" && <span>{rowCount} rows ready. Continue to map fields.</span>}
          {status === "failed" && <><FaTriangleExclamation /><span>File upload failed.</span></>}
        </div>

        {error && <p className="formError">{error}</p>}

        <button type="button" className="primaryButton" disabled={status !== "ready"} onClick={goToMapping}>
          <span>Next: Field Mapping</span>
          <FaArrowRight />
        </button>
      </div>
    </Modal>
  );
}

function downloadFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
