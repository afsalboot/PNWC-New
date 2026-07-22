import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import Equipment from "@/server/models/Equipment";
import Transaction from "@/server/models/Transaction";
import ActivityLog from "@/server/models/ActivityLog";
import { getAuthUser } from "@/server/lib/auth";

export async function PATCH(request, { params }) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  const payload = await request.json();
  const { id } = await params;
  const transaction = await Transaction.findById(id).populate("equipment").populate("equipmentId").populate("items.equipment").populate("items.equipmentId");

  if (!transaction || !["active", "partial"].includes(transaction.status?.toLowerCase())) {
    return NextResponse.json({ message: "Active transaction not found" }, { status: 404 });
  }

  const itemRows = transaction.items?.length
    ? transaction.items.map((item) => ({ equipment: item.equipment || item.equipmentId, quantity: Number(item.quantity || 1) }))
    : [{ equipment: transaction.equipment || transaction.equipmentId, quantity: Number(transaction.quantity || 1) }];
  const returnedQuantities = new Map();
  for (const event of transaction.returnEvents || []) {
    for (const item of event.items || []) {
      const key = String(item.equipmentId);
      returnedQuantities.set(key, (returnedQuantities.get(key) || 0) + Number(item.quantity || 1));
    }
  }
  const remainingItems = itemRows.map((item) => ({
    equipment: item.equipment,
    quantity: Math.max(0, item.quantity - (returnedQuantities.get(String(item.equipment?._id)) || 0)),
  })).filter((item) => item.quantity > 0);
  const requestedItems = Array.isArray(payload.items) && payload.items.length
    ? payload.items.map((item) => ({ equipmentId: String(item.equipmentId), quantity: Number(item.quantity), condition: item.condition || payload.condition || "Good" }))
    : remainingItems.map((item) => ({ equipmentId: String(item.equipment._id), quantity: item.quantity, condition: payload.condition || "Good" }));
  if (!requestedItems.length || requestedItems.some((item) => !item.equipmentId || !Number.isFinite(item.quantity) || item.quantity < 1)) {
    return NextResponse.json({ message: "Select at least one product and a valid quantity" }, { status: 400 });
  }
  const remainingById = new Map(remainingItems.map((item) => [String(item.equipment._id), item.quantity]));
  for (const item of requestedItems) {
    if (!remainingById.has(item.equipmentId) || item.quantity > remainingById.get(item.equipmentId)) {
      return NextResponse.json({ message: "Return quantity cannot exceed the remaining quantity" }, { status: 409 });
    }
    remainingById.set(item.equipmentId, remainingById.get(item.equipmentId) - item.quantity);
  }
  const returnDate = payload.returnDate ? new Date(payload.returnDate) : new Date();
  const receivedBy = authUser.name;
  transaction.returnEvents.push({ items: requestedItems, returnDate, receivedBy, remarks: payload.remarks || "" });
  transaction.status = [...remainingById.values()].every((quantity) => quantity === 0) ? "returned" : "partial";
  transaction.dateReturned = returnDate;
  transaction.returnDate = returnDate;
  transaction.returnCondition = requestedItems.every((item) => item.condition === "Repair Needed") ? "Repair Needed" : requestedItems[requestedItems.length - 1].condition;
  transaction.receivedBy = receivedBy;
  transaction.notes = payload.remarks || transaction.notes;
  await transaction.save();

  for (const item of requestedItems) {
    const equipment = await Equipment.findById(item.equipmentId);
    if (!equipment) continue;
    const totalStock = Number(equipment.totalStock ?? equipment.quantity ?? 1);
    const availableStock = Number(equipment.availableQuantity ?? equipment.availableStock ?? 0);
    const nextAvailableStock = item.condition === "Repair Needed" ? availableStock : Math.min(availableStock + item.quantity, totalStock);
    await Equipment.findByIdAndUpdate(equipment._id, {
      status: item.condition === "Repair Needed" || nextAvailableStock === 0 ? "Maintenance" : "Available",
      condition: item.condition,
      availableStock: nextAvailableStock,
      availableQuantity: nextAvailableStock,
    });
  }

  await ActivityLog.create({
    action: `Returned ${requestedItems.length} product line(s) for ${transaction.code || transaction.transactionId}`,
    actor: receivedBy,
    entityType: "transaction",
    entityId: transaction.code || transaction.transactionId,
  });

  return NextResponse.json({ ok: true });
}
