import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import ActivityLog from "@/server/models/ActivityLog";
import Equipment from "@/server/models/Equipment";
import Transaction from "@/server/models/Transaction";
import { getAuthUser } from "@/server/lib/auth";

function cleanTransaction(transaction) {
  const borrower = transaction.borrower || transaction.borrowerId || {};
  const legacyEquipment = transaction.equipment || transaction.equipmentId || {};
  const itemRows = transaction.items?.length ? transaction.items : [{ equipment: legacyEquipment, equipmentId: legacyEquipment, quantity: transaction.quantity || 1 }];
  const items = itemRows.map((item) => {
    const equipment = item.equipment || item.equipmentId || {};
    return {
      equipmentId: equipment._id?.toString() || item.equipment?.toString() || item.equipmentId?.toString(),
      equipmentName: equipment.name || equipment.equipmentName || equipment.productName || "",
      inventoryCode: equipment.code || equipment.inventoryCode || "",
      quantity: Number(item.quantity || 1),
    };
  });
  const equipment = itemRows[0]?.equipment || itemRows[0]?.equipmentId || legacyEquipment;
  const returnedItems = transaction.returnEvents?.length
    ? transaction.returnEvents.flatMap((event) => (event.items || []).map((item) => ({ equipmentId: item.equipmentId?.toString(), quantity: Number(item.quantity || 1), condition: item.condition, returnDate: event.returnDate, receivedBy: event.receivedBy })))
    : (["returned", "partial"].includes(String(transaction.status || "").toLowerCase()) ? items.map((item) => ({ equipmentId: item.equipmentId, quantity: item.quantity, condition: transaction.returnCondition, returnDate: transaction.dateReturned || transaction.returnDate, receivedBy: transaction.receivedBy })) : []);
  const rawStatus = transaction.status || "";
  const status = rawStatus.toLowerCase() === "active" ? "Active" : rawStatus.toLowerCase() === "returned" ? "Returned" : rawStatus.toLowerCase() === "partial" ? "Partial" : rawStatus;
  return {
    id: transaction._id.toString(),
    transactionId: transaction.code || transaction.transactionId || transaction.rentalId,
    code: transaction.code || transaction.transactionId || transaction.rentalId,
    borrowerId: borrower._id?.toString() || transaction.borrower?.toString() || transaction.borrowerId?.toString(),
    equipmentId: equipment._id?.toString() || transaction.equipment?.toString() || transaction.equipmentId?.toString(),
    borrowerName: borrower.name || "",
    borrowerPhone: borrower.phone || "",
    equipmentName: items.map((item) => item.equipmentName).filter(Boolean).join(" + "),
    inventoryCode: items.map((item) => item.inventoryCode).filter(Boolean).join(" + "),
    quantity: items.reduce((total, item) => total + item.quantity, 0),
    items,
    returnedItems,
    returnEvents: transaction.returnEvents || [],
    transactionDate: transaction.dateOut || transaction.transactionDate || transaction.rentalDate,
    returnDate: transaction.dateReturned || transaction.returnDate,
    status,
    remarks: transaction.notes || transaction.remarks,
    notes: transaction.notes || transaction.remarks,
    issuedBy: transaction.issuedBy,
    receivedBy: transaction.receivedBy,
    returnCondition: transaction.returnCondition,
  };
}

function findTransaction(id) {
  return Transaction.findOne({ $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : undefined }, { code: id }, { transactionId: id }] });
}

function storedItems(transaction) {
  return transaction.items?.length
    ? transaction.items.map((item) => ({ equipmentId: item.equipment || item.equipmentId, quantity: Number(item.quantity || 1) }))
    : [{ equipmentId: transaction.equipment || transaction.equipmentId, quantity: Number(transaction.quantity || 1) }];
}

export async function GET(_request, { params }) {
  await connectMongoDB();
  const { id } = await params;
  const transaction = await findTransaction(id).populate("borrower").populate("equipment").populate("borrowerId").populate("equipmentId").populate("items.equipment").populate("items.equipmentId").lean();
  if (!transaction) {
    return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
  }
  return NextResponse.json(cleanTransaction(transaction));
}

export async function PATCH(request, { params }) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  const { id } = await params;
  const payload = await request.json();
  const transaction = await findTransaction(id);
  if (!transaction) {
    return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
  }
  if (Array.isArray(payload.items)) {
    const requestedItems = payload.items.filter((item) => item.equipmentId && Number(item.quantity) > 0);
    if (!requestedItems.length) {
      return NextResponse.json({ message: "Keep at least one product in the transaction" }, { status: 400 });
    }
    if (transaction.status?.toLowerCase() === "active") {
      const oldItems = storedItems(transaction);
      const oldQuantities = new Map(oldItems.map((item) => [String(item.equipmentId), item.quantity]));
      const newQuantities = new Map();
      for (const item of requestedItems) {
        const key = String(item.equipmentId);
        newQuantities.set(key, (newQuantities.get(key) || 0) + Number(item.quantity));
      }
      const allEquipmentIds = new Set([...oldQuantities.keys(), ...newQuantities.keys()]);
      for (const equipmentId of allEquipmentIds) {
        const delta = (newQuantities.get(equipmentId) || 0) - (oldQuantities.get(equipmentId) || 0);
        if (delta === 0) continue;
        const equipment = await Equipment.findById(equipmentId);
        if (!equipment) return NextResponse.json({ message: "One or more equipment items were not found" }, { status: 404 });
        const availableStock = Number(equipment.availableQuantity ?? equipment.availableStock ?? 0);
        const totalStock = Number(equipment.totalStock ?? equipment.quantity ?? 1);
        if (delta > 0 && availableStock < delta) {
          return NextResponse.json({ message: `Only ${availableStock} available for ${equipment.name || equipment.equipmentName || "equipment"}` }, { status: 409 });
        }
        const nextAvailableStock = Math.max(0, Math.min(totalStock, availableStock - delta));
        await Equipment.findByIdAndUpdate(equipmentId, {
          availableStock: nextAvailableStock,
          availableQuantity: nextAvailableStock,
          status: nextAvailableStock > 0 ? "Available" : "Rented",
        });
      }
    }
    transaction.items = requestedItems.map((item) => ({ equipment: item.equipmentId, equipmentId: item.equipmentId, quantity: Number(item.quantity) }));
    transaction.equipment = requestedItems[0].equipmentId;
    transaction.equipmentId = requestedItems[0].equipmentId;
    transaction.quantity = Number(requestedItems[0].quantity);
  } else {
    transaction.quantity = Number(payload.quantity || transaction.quantity || 1);
  }
  transaction.notes = payload.notes || payload.remarks || "";
  transaction.issuedBy = payload.issuedBy || transaction.issuedBy || "";
  transaction.receivedBy = payload.receivedBy || transaction.receivedBy || "";
  transaction.returnCondition = payload.returnCondition || transaction.returnCondition || "";
  await transaction.save();

  await ActivityLog.create({
    action: `Updated transaction ${transaction.code || transaction.transactionId}`,
    actor: authUser.name,
    entityType: "transaction",
    entityId: transaction.code || transaction.transactionId,
  });

  const populated = await Transaction.findById(transaction._id).populate("borrower").populate("equipment").populate("borrowerId").populate("equipmentId").populate("items.equipment").populate("items.equipmentId").lean();
  return NextResponse.json(cleanTransaction(populated));
}

export async function DELETE(_request, { params }) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  const { id } = await params;
  const transaction = await findTransaction(id);
  if (!transaction) {
    return NextResponse.json({ message: "Transaction not found" }, { status: 404 });
  }
  if (transaction.status?.toLowerCase() === "active") {
    for (const item of storedItems(transaction)) {
      const equipment = await Equipment.findById(item.equipmentId);
      if (!equipment) continue;
      const totalStock = Number(equipment.totalStock ?? equipment.quantity ?? 1);
      const availableStock = Number(equipment.availableQuantity ?? equipment.availableStock ?? 0);
      const nextAvailableStock = Math.min(availableStock + item.quantity, totalStock);
      await Equipment.findByIdAndUpdate(equipment._id, {
        availableStock: nextAvailableStock,
        availableQuantity: nextAvailableStock,
        status: nextAvailableStock > 0 ? "Available" : "Rented",
      });
    }
  }
  const code = transaction.code || transaction.transactionId;
  await transaction.deleteOne();
  await ActivityLog.create({
    action: `Deleted transaction ${code}`,
    actor: authUser.name,
    entityType: "transaction",
    entityId: code,
  });
  return NextResponse.json({ ok: true });
}
