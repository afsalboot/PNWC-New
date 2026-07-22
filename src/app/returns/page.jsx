"use client";

import { useState } from "react";
import { api, conditions, filterRows } from "@/components/app/constants";
import { AppLayout, ConfirmationDialog, Field, Modal, TextArea, TransactionList } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function ReturnsPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ receivedBy: "", condition: "", from: "", to: "" });
  const [editingReturn, setEditingReturn] = useState(null);
  const [deletingReturn, setDeletingReturn] = useState(null);
  const { loading, message, setMessage, transactions, loadData } = usePnwcData();
  const returnedTransactions = transactions.filter((transaction) => transaction.status === "Returned");
  const receivedByOptions = uniqueValues(returnedTransactions, "receivedBy");
  const visibleTransactions = filterRows(returnedTransactions, search, ["transactionId", "borrowerName", "borrowerPhone", "equipmentName", "inventoryCode", "status", "issuedBy", "receivedBy", "returnCondition"])
    .filter((transaction) => matchesValue(transaction.receivedBy, filters.receivedBy))
    .filter((transaction) => matchesValue(transaction.returnCondition, filters.condition))
    .filter((transaction) => isWithinDateRange(transaction.returnDate, filters.from, filters.to));

  async function saveReturn(event) {
    event.preventDefault();
    await api(`/api/transactions/${editingReturn.id}`, {
      method: "PATCH",
      body: JSON.stringify(editingReturn),
    });
    setEditingReturn(null);
    setMessage("Return details updated.");
    await loadData();
  }

  async function deleteReturn() {
    if (!deletingReturn) return;
    await api(`/api/transactions/${deletingReturn.id}`, { method: "DELETE" });
    setDeletingReturn(null);
    setMessage("Return record deleted.");
    await loadData();
  }

  function updateReturn(key, value) {
    setEditingReturn((transaction) => ({ ...transaction, [key]: value }));
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <AppLayout activeView="Returns" search={search} onSearch={setSearch} loading={loading} message={message}>
      <section className="glass filterPanel compactFilterPanel dateFilterPanel">
        <Field label="Received By" value={filters.receivedBy} onChange={(value) => updateFilter("receivedBy", value)} options={["", ...receivedByOptions]} />
        <Field label="Condition" value={filters.condition} onChange={(value) => updateFilter("condition", value)} options={["", ...conditions]} />
        <Field label="From" type="date" value={filters.from} onChange={(value) => updateFilter("from", value)} />
        <Field label="To" type="date" value={filters.to} onChange={(value) => updateFilter("to", value)} />
        <button type="button" className="secondaryButton" onClick={() => setFilters({ receivedBy: "", condition: "", from: "", to: "" })}>Clear</button>
      </section>
      <TransactionList
        rows={visibleTransactions}
        empty="Returned equipment will appear here after the first handover closes."
        title="Returned transactions"
        getViewHref={(transaction) => `/returns/${transaction.id}`}
        onEdit={setEditingReturn}
        onDelete={setDeletingReturn}
      />
      {deletingReturn && (
        <ConfirmationDialog
          eyebrow="Return module"
          title="Delete return record?"
          message="This will remove the completed return record from history."
          details={deletingReturn.transactionId}
          confirmLabel="Delete Return"
          onCancel={() => setDeletingReturn(null)}
          onConfirm={deleteReturn}
        />
      )}
      {editingReturn && (
        <Modal eyebrow="Return module" title="Edit Return Details" onClose={() => setEditingReturn(null)}>
          <form className="formGrid" onSubmit={saveReturn}>
            <div className="returnSummary span2">
              <b>{editingReturn.transactionId}</b>
              <span>{editingReturn.borrowerName} - {editingReturn.equipmentName}</span>
            </div>
            <Field label="Received By" value={editingReturn.receivedBy || ""} onChange={(value) => updateReturn("receivedBy", value)} />
            <Field label="Return Condition" value={editingReturn.returnCondition || ""} onChange={(value) => updateReturn("returnCondition", value)} options={["", ...conditions]} />
            <TextArea label="Notes" value={editingReturn.notes || ""} onChange={(value) => updateReturn("notes", value)} />
            <button className="primaryButton span2">Save Return</button>
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
