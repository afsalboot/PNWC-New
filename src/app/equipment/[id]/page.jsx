"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { AppLayout, DetailGrid, DetailPage, Pill } from "@/components/app/ui";
import { usePnwcData } from "@/components/app/usePnwcData";

export default function EquipmentDetailsPage() {
  const params = useParams();
  const [search, setSearch] = useState("");
  const { loading, message, equipment } = usePnwcData();
  const selectedEquipment = equipment.find((row) => row.id === params.id || row.inventoryCode === params.id || row.code === params.id);

  return (
    <AppLayout activeView="Equipment" search={search} onSearch={setSearch} loading={loading} message={message}>
      {selectedEquipment ? (
        <DetailPage eyebrow="Equipment module" title="Product details" recordId={selectedEquipment.inventoryCode} status={selectedEquipment.status}>
            <div className="equipmentDetailHero">
              <div className="equipmentDetailImage">
                {selectedEquipment.image ? <img src={selectedEquipment.image} alt="" /> : <span>Product</span>}
              </div>
              <div><span>{selectedEquipment.category}</span><strong>{selectedEquipment.equipmentName}</strong><small>{selectedEquipment.description || "Ready for hospital lending."}</small></div>
            </div>
            <div className="equipmentStockSummary">
              <div><b>{selectedEquipment.availableStock}</b><span>Available</span></div>
              <div><b>{selectedEquipment.totalStock}</b><span>Total stock</span></div>
              <div><b>{selectedEquipment.condition}</b><span>Condition</span></div>
            </div>
            <DetailGrid
              rows={[
                ["Location", selectedEquipment.location],
                ["Model", selectedEquipment.model],
                ["Serial Number", selectedEquipment.serialNumber],
                ["Donor", selectedEquipment.donorName],
                ["Description", selectedEquipment.description],
              ]}
            />
        </DetailPage>
      ) : <section className="glass panel"><p className="emptyText">Equipment not found.</p></section>}
    </AppLayout>
  );
}
