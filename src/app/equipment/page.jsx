"use client";

import { useState } from "react";
import { FaBoxesStacked, FaFileArrowUp, FaPlus } from "react-icons/fa6";
import { BulkEquipmentModal } from "@/components/app/BulkEquipmentModal";
import { EquipmentModal } from "@/components/app/EquipmentModal";
import { api, conditions, filterRows, categories } from "@/components/app/constants";
import { AppLayout, ConfirmationDialog, DataPanel, Field, Pill, RecordActions } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function EquipmentPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ category: "", status: "", condition: "" });
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [deletingEquipment, setDeletingEquipment] = useState(null);
  const { loading, message, setMessage, equipment, loadData } = usePnwcData();
  const visibleEquipment = filterRows(equipment, search, ["inventoryCode", "equipmentName", "category", "status", "condition"])
    .filter((item) => matchesValue(item.category, filters.category))
    .filter((item) => matchesValue(item.status, filters.status))
    .filter((item) => matchesValue(item.condition, filters.condition));

  async function refreshAfterSave(successMessage) {
    setMessage(successMessage);
    await loadData();
  }

  async function deleteEquipment() {
    if (!deletingEquipment) return;
    await api(`/api/equipment/${deletingEquipment.id}`, { method: "DELETE" });
    setDeletingEquipment(null);
    setMessage("Equipment deleted.");
    await loadData();
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <AppLayout activeView="Equipment" search={search} onSearch={setSearch} loading={loading} message={message}>
      <div className="actionHeader">
        <div className="actionHeaderActions">
          <button className="secondaryButton" onClick={() => setBulkModalOpen(true)}><FaFileArrowUp /> <span>Bulk Add</span></button>
          <button className="primaryButton" onClick={() => setEquipmentModalOpen(true)}><FaPlus /> <span>Add Equipment</span></button>
        </div>
      </div>
      <section className="glass filterPanel compactFilterPanel">
        <Field label="Category" value={filters.category} onChange={(value) => updateFilter("category", value)} options={["", ...categories]} />
        <Field label="Status" value={filters.status} onChange={(value) => updateFilter("status", value)} options={["", "Available", "Rented", "Maintenance"]} />
        <Field label="Condition" value={filters.condition} onChange={(value) => updateFilter("condition", value)} options={["", ...conditions]} />
        <button type="button" className="secondaryButton" onClick={() => setFilters({ category: "", status: "", condition: "" })}>Clear</button>
      </section>
      <DataPanel contentClassName="equipmentList" empty="Your inventory shelf is ready. Add the first equipment item to begin lending.">
        {visibleEquipment.map((equipment) => (
          <article className="equipmentListRow" key={equipment.id}>
            {equipment.image ? (
              <img className="equipmentListThumb" src={equipment.image} alt="" />
            ) : (
              <div className="equipmentListThumb photoPlaceholder">
                <FaBoxesStacked />
              </div>
            )}
            <div className="equipmentListInfo"><b>{equipment.equipmentName}</b><span>{equipment.inventoryCode} · {equipment.category}</span><small>{equipment.availableStock} of {equipment.totalStock} available</small></div>
            <Pill>{equipment.status}</Pill>
            <RecordActions
              viewHref={`/equipment/${equipment.id}`}
              onEdit={() => setEditingEquipment(equipment)}
              onDelete={() => setDeletingEquipment(equipment)}
            />
          </article>
        ))}
      </DataPanel>

      {deletingEquipment && (
        <ConfirmationDialog
          eyebrow="Equipment module"
          title="Delete equipment?"
          message="This will remove the item and its inventory details."
          details={deletingEquipment.equipmentName}
          confirmLabel="Delete Equipment"
          onCancel={() => setDeletingEquipment(null)}
          onConfirm={deleteEquipment}
        />
      )}
      {bulkModalOpen && <BulkEquipmentModal onClose={() => setBulkModalOpen(false)} onSaved={refreshAfterSave} />}
      {equipmentModalOpen && <EquipmentModal onClose={() => setEquipmentModalOpen(false)} onSaved={refreshAfterSave} />}
      {editingEquipment && <EquipmentModal equipment={editingEquipment} onClose={() => setEditingEquipment(null)} onSaved={refreshAfterSave} />}
    </AppLayout>
  );
}

function matchesValue(value, filter) {
  return !filter || String(value || "") === filter;
}
