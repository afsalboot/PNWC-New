import mongoose from "mongoose";

const BorrowerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, unique: true, index: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    addressLine1: { type: String, default: "" },
    addressLine2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    borrowerId: { type: String, sparse: true },
    alternatePhone: { type: String, default: "" },
    ward: { type: String, default: "" },
    medicalReason: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "borrowers" },
);

export default mongoose.models.Borrower || mongoose.model("Borrower", BorrowerSchema, "borrowers");
