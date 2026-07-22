import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, default: "" },
    password: { type: String, default: "" },
    role: { type: String, default: "volunteer" },
    phone: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    status: { type: String, default: "Active" },
  },
  { timestamps: true, collection: "users" },
);

export default mongoose.models.User || mongoose.model("User", UserSchema, "users");
