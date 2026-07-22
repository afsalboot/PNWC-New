import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" },
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: "Borrower" },
    code: { type: String, unique: true, index: true },
    quantity: { type: Number, default: 1 },
    status: { type: String, default: "active", index: true },
    notes: { type: String, default: "" },
    dateOut: { type: Date, default: Date.now },
    dateReturned: { type: Date },
    issuedBy: { type: String, default: "" },
    receivedBy: { type: String, default: "" },
    returnCondition: { type: String, default: "" },
    borrowerId: { type: mongoose.Schema.Types.ObjectId, ref: "Borrower" },
    equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" },
    items: [{
      equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" },
      equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" },
      quantity: { type: Number, default: 1 },
    }],
    transactionId: { type: String },
    transactionDate: { type: Date },
    returnDate: { type: Date },
    remarks: { type: String, default: "" },
    returnEvents: [{
      items: [{
        equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment" },
        quantity: { type: Number, default: 1 },
        condition: { type: String, default: "Good" },
      }],
      returnDate: { type: Date, default: Date.now },
      receivedBy: { type: String, default: "" },
      remarks: { type: String, default: "" },
    }],
  },
  { timestamps: true, collection: "transactions" },
);

const requiredReferencePaths = ["equipment", "borrower", "equipmentId", "borrowerId", "items", "returnEvents"];
const cachedTransaction = mongoose.models.Transaction;
const hasCurrentSchema = requiredReferencePaths.every((path) => cachedTransaction?.schema.path(path));

if (cachedTransaction && !hasCurrentSchema) {
  mongoose.deleteModel("Transaction");
}

export default mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema, "transactions");
