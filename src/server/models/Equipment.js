import mongoose from "mongoose";

const EquipmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    equipmentName: { type: String, default: "", trim: true },
    productName: { type: String, default: "", trim: true },
    code: { type: String, unique: true, index: true },
    inventoryCode: { type: String },
    category: { type: String, default: "" },
    totalStock: { type: Number, default: 1 },
    quantity: { type: Number },
    availableStock: { type: Number, default: 1 },
    availableQuantity: { type: Number },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    model: { type: String, default: "" },
    serialNumber: { type: String, default: "" },
    condition: { type: String, default: "Good" },
    status: { type: String, default: "Available", index: true },
    location: { type: String, default: "" },
    donationDate: { type: Date },
    donorName: { type: String, default: "" },
  },
  { timestamps: true, collection: "equipment" },
);

const requiredEquipmentPaths = ["equipmentName", "inventoryCode", "quantity", "availableQuantity"];
const cachedEquipment = mongoose.models.Equipment;
const hasCurrentSchema = requiredEquipmentPaths.every((path) => cachedEquipment?.schema.path(path));

if (cachedEquipment && !hasCurrentSchema) {
  mongoose.deleteModel("Equipment");
}

export default mongoose.models.Equipment || mongoose.model("Equipment", EquipmentSchema, "equipment");
