"use client";

import { useState } from "react";
import { api, emptyBorrower, filterRows } from "@/components/app/constants";
import { AppLayout, ConfirmationDialog, DataPanel, Field, Modal, RecordActions, TextArea } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function BorrowersPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ city: "", state: "", from: "", to: "" });
  const [editingBorrower, setEditingBorrower] = useState(null);
  const [deletingBorrower, setDeletingBorrower] = useState(null);
  const { loading, message, setMessage, borrowers, loadData } = usePnwcData();
  const cityOptions = uniqueValues(borrowers, "city");
  const stateOptions = uniqueValues(borrowers, "state");
  const visibleBorrowers = filterRows(borrowers, search, ["borrowerId", "code", "name", "phone", "address", "city", "state", "pincode"])
    .filter((borrower) => matchesValue(borrower.city, filters.city))
    .filter((borrower) => matchesValue(borrower.state, filters.state))
    .filter((borrower) => isWithinDateRange(borrower.createdAt, filters.from, filters.to));

  async function saveBorrower(event) {
    event.preventDefault();
    await api(`/api/borrowers/${editingBorrower.id}`, {
      method: "PATCH",
      body: JSON.stringify(editingBorrower),
    });
    setEditingBorrower(null);
    setMessage("Borrower updated.");
    await loadData();
  }

  async function deleteBorrower() {
    if (!deletingBorrower) return;
    await api(`/api/borrowers/${deletingBorrower.id}`, { method: "DELETE" });
    setDeletingBorrower(null);
    setMessage("Borrower deleted.");
    await loadData();
  }

  function updateBorrower(key, value) {
    setEditingBorrower((borrower) => ({ ...borrower, [key]: value }));
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <AppLayout activeView="Borrowers" search={search} onSearch={setSearch} loading={loading} message={message}>
      <section className="glass filterPanel compactFilterPanel dateFilterPanel">
        <Field label="City" value={filters.city} onChange={(value) => updateFilter("city", value)} options={["", ...cityOptions]} />
        <Field label="State" value={filters.state} onChange={(value) => updateFilter("state", value)} options={["", ...stateOptions]} />
        <Field label="From" type="date" value={filters.from} onChange={(value) => updateFilter("from", value)} />
        <Field label="To" type="date" value={filters.to} onChange={(value) => updateFilter("to", value)} />
        <button type="button" className="secondaryButton" onClick={() => setFilters({ city: "", state: "", from: "", to: "" })}>Clear</button>
      </section>
      <DataPanel title="Previous Borrowers" contentClassName="borrowerList" empty="Borrower history starts with the first equipment handover.">
        {visibleBorrowers.map((borrower) => (
          <article className="borrowerListRow" key={borrower.id}>
            <div className="borrowerListIdentity"><b>{borrower.name}</b><span>{borrower.borrowerId} · {borrower.phone}</span></div>
            <p>{borrower.address || "No address added."}</p>
            <RecordActions
              viewHref={`/borrowers/${borrower.id}`}
              onEdit={() => setEditingBorrower({ ...emptyBorrower, ...borrower })}
              onDelete={() => setDeletingBorrower(borrower)}
            />
          </article>
        ))}
      </DataPanel>
      {deletingBorrower && (
        <ConfirmationDialog
          eyebrow="Borrower module"
          title="Delete borrower?"
          message="This will remove the borrower record from the system."
          details={deletingBorrower.name}
          confirmLabel="Delete Borrower"
          onCancel={() => setDeletingBorrower(null)}
          onConfirm={deleteBorrower}
        />
      )}
      {editingBorrower && (
        <Modal eyebrow="Borrower module" title="Edit Borrower" onClose={() => setEditingBorrower(null)}>
          <form className="formGrid" onSubmit={saveBorrower}>
            <Field label="Borrower Name" value={editingBorrower.name} onChange={(value) => updateBorrower("name", value)} required />
            <Field label="Code" value={editingBorrower.code} onChange={(value) => updateBorrower("code", value)} />
            <Field label="Phone" value={editingBorrower.phone} onChange={(value) => updateBorrower("phone", value)} required />
            <Field label="Alternate Phone" value={editingBorrower.alternatePhone || ""} onChange={(value) => updateBorrower("alternatePhone", value)} />
            <Field label="Address Line 1" value={editingBorrower.addressLine1 || ""} onChange={(value) => updateBorrower("addressLine1", value)} />
            <Field label="Address Line 2" value={editingBorrower.addressLine2 || ""} onChange={(value) => updateBorrower("addressLine2", value)} />
            <Field label="City" value={editingBorrower.city || ""} onChange={(value) => updateBorrower("city", value)} />
            <Field label="State" value={editingBorrower.state || ""} onChange={(value) => updateBorrower("state", value)} />
            <Field label="Pincode" value={editingBorrower.pincode || ""} onChange={(value) => updateBorrower("pincode", value)} />
            <Field label="Emergency Contact" value={editingBorrower.emergencyContact || ""} onChange={(value) => updateBorrower("emergencyContact", value)} />
            <TextArea label="Notes" value={editingBorrower.notes || ""} onChange={(value) => updateBorrower("notes", value)} />
            <button className="primaryButton span2">Save Borrower</button>
          </form>
        </Modal>
      )}
    </AppLayout>
  );
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();
}

function matchesValue(value, filter) {
  return !filter || String(value || "") === filter;
}

function isWithinDateRange(value, from, to) {
  if (!from && !to) return true;
  if (!value) return false;
  const time = new Date(value).setHours(0, 0, 0, 0);
  const fromTime = from ? new Date(from).setHours(0, 0, 0, 0) : -Infinity;
  const toTime = to ? new Date(to).setHours(23, 59, 59, 999) : Infinity;
  return time >= fromTime && time <= toTime;
}
