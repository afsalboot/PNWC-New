"use client";

import { useState } from "react";
import { api, categories, conditions, emptyEquipment, uploadImage } from "./constants";
import { Field, Modal, TextArea, UploadField } from "./ui";

export function EquipmentModal({ equipment, onClose, onSaved }) {
  const [equipmentForm, setEquipmentForm] = useState({ ...emptyEquipment, ...equipment, name: equipment?.name || equipment?.equipmentName || emptyEquipment.name });
  const [uploading, setUploading] = useState(false);

  function updateEquipment(key, value) {
    setEquipmentForm((form) => ({ ...form, [key]: value }));
  }

  async function uploadEquipmentImage(file) {
    if (!file) return;
    setUploading(true);
    try {
      const image = await uploadImage(file, "equipment");
      updateEquipment("image", image);
    } finally {
      setUploading(false);
    }
  }

  async function createEquipment(event) {
    event.preventDefault();
    const path = equipment?.id ? `/api/equipment/${equipment.id}` : "/api/equipment";
    const method = equipment?.id ? "PATCH" : "POST";
    await api(path, { method, body: JSON.stringify(equipmentForm) });
    setEquipmentForm(emptyEquipment);
    onSaved?.(equipment?.id ? "Equipment updated." : "Equipment saved to MongoDB.");
    onClose();
  }

  return (
    <Modal title={equipment?.id ? "Edit Equipment" : "Add Equipment"} eyebrow="Equipment module" onClose={onClose}>
      <form className="formGrid" onSubmit={createEquipment}>
        <Field label="Equipment Name" value={equipmentForm.name} onChange={(value) => updateEquipment("name", value)} required />
        <Field label="Code" value={equipmentForm.code} onChange={(value) => updateEquipment("code", value)} />
        <Field label="Category" value={equipmentForm.category} onChange={(value) => updateEquipment("category", value)} options={categories} />
        <Field label="Total Stock" type="number" value={equipmentForm.totalStock} onChange={(value) => updateEquipment("totalStock", value)} />
        <Field label="Available Stock" type="number" value={equipmentForm.availableStock} onChange={(value) => updateEquipment("availableStock", value)} />
        <Field label="Condition" value={equipmentForm.condition} onChange={(value) => updateEquipment("condition", value)} options={conditions} />
        <Field label="Status" value={equipmentForm.status} onChange={(value) => updateEquipment("status", value)} options={["Available", "Rented", "Maintenance"]} />
        <UploadField label="Equipment Photo" value={equipmentForm.image} onChange={(value) => updateEquipment("image", value)} onUpload={uploadEquipmentImage} uploading={uploading} />
        <TextArea label="Description" value={equipmentForm.description} onChange={(value) => updateEquipment("description", value)} />
        <button className="primaryButton span2" disabled={uploading}>{uploading ? "Uploading..." : "Save Equipment"}</button>
      </form>
    </Modal>
  );
}
