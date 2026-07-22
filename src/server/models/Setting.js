import mongoose from "mongoose";

const SettingSchema = new mongoose.Schema(
  {
    associationName: { type: String, default: "Punch Nagar Welfare Committee" },
    logo: { type: String, default: "/Logo.jpeg" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    defaultCategories: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.models.Setting || mongoose.model("Setting", SettingSchema);
