"use client";

import { useState } from "react";
import { FaChevronDown, FaPlus, FaTrash } from "react-icons/fa6";
import { useAuth } from "@/context/AuthContext";
import { api, emptyBorrower, emptyTransaction } from "./constants";
import { Field, Modal, TextArea } from "./ui";

export function IssueModal({ borrowers, equipment, onClose, onSaved }) {
  const { user } = useAuth();
  const [borrowerSearch, setBorrowerSearch] = useState("");
  const [borrowerForm, setBorrowerForm] = useState(emptyBorrower);
  const [transactionForm, setTransactionForm] = useState({ ...emptyTransaction, items: [{ equipmentId: "", quantity: 1 }], issuedBy: "" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const availableEquipment = equipment.filter((equipment) => equipment.status === "Available" && Number(equipment.availableStock || 0) > 0);
  const normalizedBorrowerSearch = borrowerSearch.trim().toLowerCase();
  const matchedBorrower = normalizedBorrowerSearch
    ? borrowers.find((borrower) => (
        borrower.phone?.toLowerCase().includes(normalizedBorrowerSearch)
        || borrower.name?.toLowerCase().includes(normalizedBorrowerSearch)
        || borrower.borrowerId?.toLowerCase().includes(normalizedBorrowerSearch)
        || borrower.code?.toLowerCase().includes(normalizedBorrowerSearch)
      ))
    : null;
  const isNewBorrower = Boolean(borrowerSearch.trim()) && !matchedBorrower;

  function updateBorrower(key, value) {
    setBorrowerForm((form) => ({ ...form, [key]: value }));
  }

  function updateBorrowerSearch(value) {
    setBorrowerSearch(value);
    setBorrowerForm((form) => {
      const trimmedValue = value.trim();
      if (/^\d/.test(trimmedValue)) {
        return { ...form, phone: trimmedValue };
      }
      return { ...form, name: value };
    });
  }

  function updateTransaction(key, value) {
    setFormError("");
    setTransactionForm((form) => ({ ...form, [key]: value }));
  }

  function updateItem(index, key, value) {
    setFormError("");
    setTransactionForm((form) => ({
      ...form,
      items: form.items.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
    }));
  }

  function addItem() {
    setTransactionForm((form) => ({ ...form, items: [...form.items, { equipmentId: "", quantity: 1 }] }));
  }

  function removeItem(index) {
    setTransactionForm((form) => ({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index) }));
  }

  async function createTransaction(event) {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const items = transactionForm.items.map((item) => ({ equipmentId: item.equipmentId, quantity: Number(item.quantity || 1) }));
      if (!items.length || items.some((item) => !item.equipmentId || item.quantity < 1)) {
        throw new Error("Select equipment and quantity for every product.");
      }
      const duplicateIds = items.map((item) => item.equipmentId);
      if (new Set(duplicateIds).size !== duplicateIds.length) {
        throw new Error("Choose each product only once.");
      }
      for (const item of items) {
        const selectedEquipment = availableEquipment.find((equipment) => equipment.id === item.equipmentId);
        const availableStock = Number(selectedEquipment?.availableStock || 0);
        if (!selectedEquipment || item.quantity > availableStock) {
          throw new Error(`Only ${availableStock} available for ${selectedEquipment?.equipmentName || "the selected equipment"}.`);
        }
      }

      let borrowerId = matchedBorrower?.id;

      if (!borrowerId) {
        const borrower = await api("/api/borrowers", {
          method: "POST",
          body: JSON.stringify(borrowerForm),
        });
        borrowerId = borrower.id;
      }

      await api("/api/transactions", {
        method: "POST",
        body: JSON.stringify({ ...transactionForm, items, borrowerId, issuedBy: user?.name }),
      });
      setTransactionForm({ ...emptyTransaction, items: [{ equipmentId: "", quantity: 1 }], issuedBy: "" });
      setBorrowerForm(emptyBorrower);
      onSaved?.("Equipment lent and equipment status updated.");
      onClose();
    } catch (error) {
      setFormError(error.message || "Unable to lend equipment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Lend Equipment" eyebrow="Transaction module" onClose={onClose}>
      <form className="formGrid" onSubmit={createTransaction}>
        <div className="productLines span2">
          <div className="productLinesHeader"><span>Equipment to lend</span><b>{transactionForm.items.length} product{transactionForm.items.length === 1 ? "" : "s"}</b></div>
          {transactionForm.items.map((item, index) => {
            const selectedEquipment = availableEquipment.find((equipment) => equipment.id === item.equipmentId);
            return (
              <div className="productLine" key={`${index}-${item.equipmentId}`}>
                <EquipmentPicker
                  label={`Product ${index + 1}`}
                  equipment={availableEquipment}
                  selectedId={item.equipmentId}
                  excludedIds={transactionForm.items.filter((_, rowIndex) => rowIndex !== index).map((row) => row.equipmentId)}
                  onSelect={(value) => updateItem(index, "equipmentId", value)}
                />
                <label className="field quantityField">
                  <span>Qty</span>
                  <input min="1" max={selectedEquipment?.availableStock || 1} type="number" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} required />
                </label>
                {transactionForm.items.length > 1 && <button type="button" className="iconButton small dangerButton productRemoveButton" aria-label={`Remove product ${index + 1}`} title="Remove product" onClick={() => removeItem(index)}><FaTrash /></button>}
              </div>
            );
          })}
          <button type="button" className="secondaryButton addProductButton" onClick={addItem}><FaPlus /> <span>Add another product</span></button>
        </div>
        <label className="field span2">
          <span>Borrower Name, ID or Phone</span>
          <input value={borrowerSearch} onChange={(event) => updateBorrowerSearch(event.target.value)} placeholder="Type name, ID or phone to fetch previous borrower" required />
        </label>
        {matchedBorrower && (
          <div className="borrowerMatch span2">
            <b>{matchedBorrower.name}</b>
            <span>{matchedBorrower.borrowerId} - {matchedBorrower.phone}</span>
            <p>{matchedBorrower.address || "Previous borrower found."}</p>
          </div>
        )}
        {isNewBorrower && (
          <>
            <Field label="Borrower Name" value={borrowerForm.name} onChange={(value) => updateBorrower("name", value)} required />
            <Field label="Code" value={borrowerForm.code} onChange={(value) => updateBorrower("code", value)} />
            <Field label="Phone" value={borrowerForm.phone} onChange={(value) => updateBorrower("phone", value)} required />
            <Field label="Address Line 1" value={borrowerForm.addressLine1} onChange={(value) => updateBorrower("addressLine1", value)} />
            <Field label="Address Line 2" value={borrowerForm.addressLine2} onChange={(value) => updateBorrower("addressLine2", value)} />
            <Field label="City" value={borrowerForm.city} onChange={(value) => updateBorrower("city", value)} />
            <Field label="State" value={borrowerForm.state} onChange={(value) => updateBorrower("state", value)} />
            <Field label="Pincode" value={borrowerForm.pincode} onChange={(value) => updateBorrower("pincode", value)} />
            <TextArea label="Borrower Notes" value={borrowerForm.notes} onChange={(value) => updateBorrower("notes", value)} />
          </>
        )}
        <Field label="Issued By" value={transactionForm.issuedBy || user?.name || ""} onChange={(value) => updateTransaction("issuedBy", value)} required />
        <TextArea label="Loan Notes" value={transactionForm.notes} onChange={(value) => updateTransaction("notes", value)} />
        {formError && <p className="formError span2">{formError}</p>}
        <button className="primaryButton span2" disabled={saving || !availableEquipment.length}>
          {saving ? "Lending..." : "Lend Equipment"}
        </button>
      </form>
    </Modal>
  );
}

export function EquipmentPicker({ label = "Equipment", equipment, selectedId, excludedIds = [], onSelect }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = equipment.find((item) => item.id === selectedId);
  const normalizedSearch = search.trim().toLowerCase();
  const matches = equipment.filter((item) => {
    if (excludedIds.includes(item.id)) return false;
    if (!normalizedSearch) return true;
    return [item.equipmentName, item.inventoryCode, item.category].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
  });

  return (
    <div className="field equipmentPicker">
      <span>{label}</span>
      <button type="button" className={`equipmentPickerTrigger${open ? " active" : ""}`} onClick={() => setOpen((value) => !value)}>
        <span>{selected ? `${selected.inventoryCode} - ${selected.equipmentName}` : "Select equipment"}</span>
        <FaChevronDown />
      </button>
      {open && (
        <div className="equipmentPickerMenu">
          <input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search equipment or code" />
          <div className="equipmentPickerList" role="listbox">
            {matches.length ? matches.map((item) => (
              <button type="button" key={item.id} className={item.id === selectedId ? "selected" : ""} onClick={() => { onSelect(item.id); setOpen(false); setSearch(""); }}>
                <b>{item.inventoryCode} - {item.equipmentName}</b>
                <span>{item.availableStock} available</span>
              </button>
            )) : <p className="emptyText">No matching equipment.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
