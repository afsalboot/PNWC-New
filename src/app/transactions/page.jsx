"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaClipboardCheck, FaHandHoldingMedical } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { IssueModal } from "@/components/app/IssueModal";
import { api, conditions, filterRows } from "@/components/app/constants";
import { AppLayout, ConfirmationDialog, Field, Modal, TextArea, TransactionList, Title } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "", issuedBy: "", from: "", to: "" });
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [returnForm, setReturnForm] = useState({
    condition: "Good",
    returnDate: todayValue(),
    remarks: "",
    items: [],
  });
  const { loading, message, setMessage, borrowers, equipment, transactions, loadData } = usePnwcData();
  const issuedByOptions = uniqueValues(transactions, "issuedBy");
  const visibleTransactions = filterRows(transactions, search, ["transactionId", "borrowerName", "borrowerPhone", "equipmentName", "inventoryCode", "status", "issuedBy", "receivedBy"])
    .filter((transaction) => matchesValue(transaction.status, filters.status))
    .filter((transaction) => matchesValue(transaction.issuedBy, filters.issuedBy))
    .filter((transaction) => isWithinDateRange(transaction.transactionDate, filters.from, filters.to));

  useEffect(() => {
    function openIssueEquipment() {
      setIssueModalOpen(true);
    }

    window.addEventListener("openIssueEquipment", openIssueEquipment);
    if (window.location.search.includes("issue=1")) {
      window.setTimeout(openIssueEquipment, 0);
      window.history.replaceState(null, "", "/transactions");
    }
    return () => window.removeEventListener("openIssueEquipment", openIssueEquipment);
  }, []);

  async function refreshAfterSave(successMessage) {
    setMessage(successMessage);
    await loadData();
  }

  function openReturnModal(transaction) {
    setSelectedTransaction(transaction);
    const remainingItems = getRemainingItems(transaction);
    setReturnForm({
      condition: "Good",
      returnDate: todayValue(),
      remarks: "",
      items: remainingItems.map((item) => ({ equipmentId: item.equipmentId, quantity: item.quantity, selected: true })),
    });
  }

  async function completeReturn(event) {
    event.preventDefault();
    if (!selectedTransaction) return;
    const items = returnForm.items.filter((item) => item.selected).map(({ equipmentId, quantity }) => ({ equipmentId, quantity: Number(quantity), condition: returnForm.condition }));
    if (!items.length) return;

    try {
      await api(`/api/transactions/${selectedTransaction.id}/return`, {
        method: "PATCH",
        body: JSON.stringify({ ...returnForm, items }),
      });
      setSelectedTransaction(null);
      setMessage("Equipment returned and inventory updated.");
      await loadData();
    } catch (error) {
      setSelectedTransaction(null);
      setMessage(error.message || "This transaction is no longer available for return.");
      await loadData();
    }
  }

  async function saveTransaction(event) {
    event.preventDefault();
    await api(`/api/transactions/${editingTransaction.id}`, {
      method: "PATCH",
      body: JSON.stringify(editingTransaction),
    });
    setEditingTransaction(null);
    setMessage("Transaction updated.");
    await loadData();
  }

  async function deleteTransaction() {
    if (!deletingTransaction) return;
    await api(`/api/transactions/${deletingTransaction.id}`, { method: "DELETE" });
    setDeletingTransaction(null);
    setMessage("Transaction deleted.");
    await loadData();
  }

  function updateEditingTransaction(key, value) {
    setEditingTransaction((transaction) => ({ ...transaction, [key]: value }));
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <AppLayout activeView="Transactions" search={search} onSearch={setSearch} loading={loading} message={message}>
      <div className="actionHeader">
        <Title eyebrow="Transaction module" title="" />
        <div className="actionHeaderActions">
          <Link className="secondaryButton" href="/returns"><FaClipboardCheck /> <span>Returns</span></Link>
          <button className="primaryButton" onClick={() => setIssueModalOpen(true)}><FaHandHoldingMedical /> <span>Lend</span></button>
        </div>
      </div>
      <section className="glass filterPanel compactFilterPanel dateFilterPanel">
        <Field label="Status" value={filters.status} onChange={(value) => updateFilter("status", value)} options={["", "Active", "Partial", "Returned"]} />
        <Field label="Issued By" value={filters.issuedBy} onChange={(value) => updateFilter("issuedBy", value)} options={["", ...issuedByOptions]} />
        <Field label="From" type="date" value={filters.from} onChange={(value) => updateFilter("from", value)} />
        <Field label="To" type="date" value={filters.to} onChange={(value) => updateFilter("to", value)} />
        <button type="button" className="secondaryButton" onClick={() => setFilters({ status: "", issuedBy: "", from: "", to: "" })}>Clear</button>
      </section>
      <TransactionList
        rows={visibleTransactions}
        empty="Nothing is on the move yet. Lend equipment to start the first record."
        actionLabel="Return"
        onAction={openReturnModal}
        canAction={(transaction) => ["Active", "Partial"].includes(transaction.status)}
        getViewHref={(transaction) => `/transactions/${transaction.id}`}
        onEdit={setEditingTransaction}
        onDelete={setDeletingTransaction}
      />

      {issueModalOpen && <IssueModal borrowers={borrowers} equipment={equipment} onClose={() => setIssueModalOpen(false)} onSaved={refreshAfterSave} />}
      {deletingTransaction && (
        <ConfirmationDialog
          eyebrow="Transaction module"
          title="Delete transaction?"
          message="This will remove the lending record from transaction history."
          details={deletingTransaction.transactionId}
          confirmLabel="Delete Transaction"
          onCancel={() => setDeletingTransaction(null)}
          onConfirm={deleteTransaction}
        />
      )}
      {selectedTransaction && (
        <Modal className="receiveModal" eyebrow="Return module" title="Receive equipment" onClose={() => setSelectedTransaction(null)}>
          <form className="formGrid" onSubmit={completeReturn}>
            <div className="returnSummary span2">
              <b>{selectedTransaction.transactionId}</b>
              <span>{selectedTransaction.borrowerName} - choose products to return now</span>
            </div>
            <div className="returnLines span2">
              <div className="productLinesHeader"><div><span>Products ready to return</span><small>Choose one product or complete the full return.</small></div><button type="button" className="selectAllReturnButton" onClick={() => setReturnForm((form) => ({ ...form, items: form.items.map((item) => ({ ...item, selected: !form.items.every((row) => row.selected) })) }))}>{returnForm.items.every((item) => item.selected) ? "Clear all" : "Select all"}</button></div>
              {getRemainingItems(selectedTransaction).map((item) => {
                const formItem = returnForm.items.find((row) => row.equipmentId === item.equipmentId) || { selected: false, quantity: item.quantity };
                return (
                  <label className={`returnLine${formItem.selected ? " selected" : ""}`} key={item.equipmentId}>
                    <input className="returnCheck" type="checkbox" checked={Boolean(formItem.selected)} onChange={(event) => setReturnForm((form) => ({ ...form, items: form.items.map((row) => row.equipmentId === item.equipmentId ? { ...row, selected: event.target.checked } : row) }))} />
                    <span><b>{item.equipmentName}</b><small>{item.inventoryCode} - {item.quantity} remaining</small></span>
                    <input min="1" max={item.quantity} type="number" value={formItem.quantity} disabled={!formItem.selected} onChange={(event) => setReturnForm((form) => ({ ...form, items: form.items.map((row) => row.equipmentId === item.equipmentId ? { ...row, quantity: event.target.value } : row) }))} />
                  </label>
                );
              })}
            </div>
            <Field label="Condition" value={returnForm.condition} onChange={(value) => setReturnForm((form) => ({ ...form, condition: value }))} options={conditions} />
            <div className="field"><span>Received By</span><div className="readonlyField accountReadOnly"><span>{user?.name || "Logged-in user"}</span></div></div>
            <Field label="Return Date" type="date" value={returnForm.returnDate} onChange={(value) => setReturnForm((form) => ({ ...form, returnDate: value }))} required />
            <TextArea label="Remarks" value={returnForm.remarks} onChange={(value) => setReturnForm((form) => ({ ...form, remarks: value }))} />
            <button className="primaryButton span2">Submit Return</button>
          </form>
        </Modal>
      )}
      {editingTransaction && (
        <Modal eyebrow="Transaction module" title="Edit Transaction" onClose={() => setEditingTransaction(null)}>
          <form className="formGrid" onSubmit={saveTransaction}>
            <div className="returnSummary span2">
              <b>{editingTransaction.transactionId}</b>
              <span>{editingTransaction.borrowerName} - {editingTransaction.equipmentName}</span>
            </div>
            <Field label="Quantity" type="number" value={editingTransaction.quantity} onChange={(value) => updateEditingTransaction("quantity", value)} />
            <Field label="Issued By" value={editingTransaction.issuedBy || ""} onChange={(value) => updateEditingTransaction("issuedBy", value)} />
            <div className="field"><span>Received By</span><div className="readonlyField">{editingTransaction.receivedBy || "Not received yet"}</div></div>
            <Field label="Return Condition" value={editingTransaction.returnCondition || ""} onChange={(value) => updateEditingTransaction("returnCondition", value)} options={["", ...conditions]} />
            <TextArea label="Notes" value={editingTransaction.notes || ""} onChange={(value) => updateEditingTransaction("notes", value)} />
            <button className="primaryButton span2">Save Transaction</button>
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

function getRemainingItems(transaction) {
  const items = transaction.items?.length ? transaction.items : [{
    equipmentId: transaction.equipmentId,
    equipmentName: transaction.equipmentName,
    inventoryCode: transaction.inventoryCode,
    quantity: transaction.quantity || 1,
  }];
  const returned = new Map();
  (transaction.returnedItems || []).forEach((item) => {
    returned.set(item.equipmentId, (returned.get(item.equipmentId) || 0) + Number(item.quantity || 0));
  });
  return items.map((item) => ({
    ...item,
    quantity: Math.max(0, Number(item.quantity || 1) - (returned.get(item.equipmentId) || 0)),
  })).filter((item) => item.quantity > 0);
}
