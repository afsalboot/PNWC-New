"use client";

import { useState } from "react";
import { EquipmentModal } from "@/components/app/EquipmentModal";
import { AppLayout, DataPanel, Pill } from "@/components/app/ui";
import { filterRows } from "@/components/app/constants";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function AddEquipmentPage() {
  const [search, setSearch] = useState("");
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(true);
  const { loading, message, setMessage, equipment, loadData } = usePnwcData();
  const visibleEquipment = filterRows(equipment, search, ["inventoryCode", "equipmentName", "category", "status"]);

  async function refreshAfterSave(successMessage) {
    setMessage(successMessage);
    await loadData();
  }

  return (
    <AppLayout activeView="Equipment" search={search} onSearch={setSearch} loading={loading} message={message}>
      <DataPanel empty="Your inventory shelf is ready. Add the first equipment item to begin lending.">
        {visibleEquipment.map((equipment) => (
          <article className="recordCard" key={equipment.id}>
            <b>{equipment.equipmentName}</b>
            <span>{equipment.inventoryCode} - {equipment.category}</span>
            <p>{equipment.availableStock} of {equipment.totalStock} available <Pill>{equipment.status}</Pill></p>
          </article>
        ))}
      </DataPanel>
      {equipmentModalOpen && <EquipmentModal onClose={() => setEquipmentModalOpen(false)} onSaved={refreshAfterSave} />}
    </AppLayout>
  );
}
