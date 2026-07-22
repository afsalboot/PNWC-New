"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { api, conditions, formatDate } from "@/components/app/constants";
import { EquipmentPicker } from "@/components/app/IssueModal";
import { AppLayout, ConfirmationDialog, DetailGrid, DetailPage, Field, Modal, TextArea } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function TransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(false);
  const { loading, message, setMessage, equipment, transactions, loadData } = usePnwcData();
  const transaction = transactions.find((row) => row.id === params.id || row.transactionId === params.id || row.code === params.id);

  function getEditItems(row) {
    return row.items?.length ? row.items.map((item) => ({ equipmentId: item.equipmentId, quantity: item.quantity })) : [{ equipmentId: row.equipmentId, quantity: row.quantity || 1 }];
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
    if (!transaction) return;
    await api(`/api/transactions/${transaction.id}`, { method: "DELETE" });
    setDeletingTransaction(false);
    setMessage("Transaction deleted.");
    router.push("/transactions");
  }

  return (
    <AppLayout activeView="Transactions" search={search} onSearch={setSearch} loading={loading} message={message}>
      {transaction ? (
        <DetailPage eyebrow="Transaction module" title="Transaction details" recordId={transaction.transactionId} status={transaction.status}>
            <div className="detailPageActions">
              <button type="button" className="secondaryButton" onClick={() => setEditingTransaction({ ...transaction, items: getEditItems(transaction) })}>Edit</button>
              <button type="button" className="dangerOutlineButton" onClick={() => setDeletingTransaction(true)}>Delete</button>
            </div>
            <section className="transactionProducts">
              <div className="transactionProductsHeader"><div><span>Products in this transaction</span><small>Issued together for this borrower</small></div><b>{getProductItems(transaction).length} product{getProductItems(transaction).length === 1 ? "" : "s"}</b></div>
              <div className="transactionProductList">
                {getProductItems(transaction).map((item) => (
                  <div className="transactionProductRow" key={item.equipmentId}>
                    <div><strong>{item.equipmentName}</strong><span>{item.inventoryCode}</span></div>
                    <b>x{item.quantity}</b>
                  </div>
                ))}
              </div>
            </section>
            <DetailGrid
              rows={[
                ["Borrower", transaction.borrowerName],
                ["Borrower Phone", transaction.borrowerPhone],
                ["Issued", formatDate(transaction.transactionDate)],
                ["Issued By", transaction.issuedBy],
                ["Returned", formatDate(transaction.returnDate)],
                ["Received By", transaction.receivedBy],
                ["Return Condition", transaction.returnCondition],
                ["Notes", transaction.notes],
              ]}
            />
        </DetailPage>
      ) : <section className="glass panel"><p className="emptyText">Transaction not found.</p></section>}
      {editingTransaction && (
        <Modal title="Edit Transaction" onClose={() => setEditingTransaction(null)}>
          <form className="formGrid" onSubmit={saveTransaction}>
            <div className="returnSummary span2">
              <b>{editingTransaction.transactionId}</b>
              <span>{editingTransaction.borrowerName} - {editingTransaction.items.length} product{editingTransaction.items.length === 1 ? "" : "s"}</span>
            </div>
            <div className="productLines span2">
              <div className="productLinesHeader"><span>Products in this transaction</span><b>Edit the issue list</b></div>
              {editingTransaction.items.map((item, index) => (
                <div className="productLine" key={`${index}-${item.equipmentId}`}>
                  <EquipmentPicker
                    label={`Product ${index + 1}`}
                    equipment={equipment}
                    selectedId={item.equipmentId}
                    excludedIds={editingTransaction.items.filter((_, rowIndex) => rowIndex !== index).map((row) => row.equipmentId)}
                    onSelect={(value) => setEditingTransaction((current) => ({ ...current, items: current.items.map((row, rowIndex) => rowIndex === index ? { ...row, equipmentId: value } : row) }))}
                  />
                  <label className="field quantityField">
                    <span>Qty</span>
                    <input min="1" type="number" value={item.quantity} onChange={(event) => setEditingTransaction((current) => ({ ...current, items: current.items.map((row, rowIndex) => rowIndex === index ? { ...row, quantity: event.target.value } : row) }))} required />
                  </label>
                  {editingTransaction.items.length > 1 && <button type="button" className="iconButton small dangerButton productRemoveButton" aria-label="Remove product" title="Remove product" onClick={() => setEditingTransaction((current) => ({ ...current, items: current.items.filter((_, rowIndex) => rowIndex !== index) }))}><FaTrash /></button>}
                </div>
              ))}
              <button type="button" className="secondaryButton addProductButton" onClick={() => setEditingTransaction((current) => ({ ...current, items: [...current.items, { equipmentId: "", quantity: 1 }] }))}><FaPlus /> <span>Add product</span></button>
            </div>
            <Field label="Issued By" value={editingTransaction.issuedBy || ""} onChange={(value) => setEditingTransaction((current) => ({ ...current, issuedBy: value }))} />
            <div className="field"><span>Received By</span><div className="readonlyField">{editingTransaction.receivedBy || "Not received yet"}</div></div>
            <Field label="Return Condition" value={editingTransaction.returnCondition || ""} onChange={(value) => setEditingTransaction((current) => ({ ...current, returnCondition: value }))} options={["", ...conditions]} />
            <TextArea label="Notes" value={editingTransaction.notes || ""} onChange={(value) => setEditingTransaction((current) => ({ ...current, notes: value }))} />
            <button className="primaryButton span2">Save Transaction</button>
          </form>
        </Modal>
      )}
      {deletingTransaction && (
        <ConfirmationDialog
          title="Delete transaction?"
          message="This will remove the lending record from transaction history."
          details={transaction?.transactionId}
          confirmLabel="Delete Transaction"
          onCancel={() => setDeletingTransaction(false)}
          onConfirm={deleteTransaction}
        />
      )}
    </AppLayout>
  );
}

function getProductItems(transaction) {
  return transaction.items?.length ? transaction.items : [{ equipmentId: transaction.equipmentId, equipmentName: transaction.equipmentName, inventoryCode: transaction.inventoryCode, quantity: transaction.quantity || 1 }];
}
