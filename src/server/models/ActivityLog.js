import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    actor: { type: String, default: "System" },
    entityType: { type: String, default: "" },
    entityId: { type: String, default: "" },
  },
  { timestamps: true },
);

export default mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
