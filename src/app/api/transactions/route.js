import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import Borrower from "@/server/models/Borrower";
import Equipment from "@/server/models/Equipment";
import Transaction from "@/server/models/Transaction";
import ActivityLog from "@/server/models/ActivityLog";
import { getAuthUser } from "@/server/lib/auth";

function getEquipmentName(equipment) {
  return equipment.name || equipment.equipmentName || equipment.productName || equipment.code || equipment.inventoryCode || "equipment";
}

function getAvailableStock(equipment) {
  const stock = equipment.availableQuantity ?? equipment.availableStock ?? 0;
  return Number(stock);
}

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
    : (statusIsReturned(transaction.status) ? items.map((item) => ({ equipmentId: item.equipmentId, quantity: item.quantity, condition: transaction.returnCondition, returnDate: transaction.dateReturned || transaction.returnDate, receivedBy: transaction.receivedBy })) : []);
  const rawStatus = transaction.status || "";
  const status = rawStatus.toLowerCase() === "active"
    ? "Active"
    : rawStatus.toLowerCase() === "returned"
      ? "Returned"
      : rawStatus.toLowerCase() === "partial"
        ? "Partial"
      : rawStatus;
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

function statusIsReturned(status) {
  return ["returned", "partial"].includes(String(status || "").toLowerCase());
}

export async function GET() {
  await connectMongoDB();
  const transactions = await Transaction.find()
    .populate("borrower")
    .populate("equipment")
    .populate("borrowerId")
    .populate("equipmentId")
    .populate("items.equipment")
    .populate("items.equipmentId")
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json(transactions.map(cleanTransaction));
}

export async function POST(request) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  const payload = await request.json();
  const borrower = await Borrower.findById(payload.borrowerId);
  const requestedItems = Array.isArray(payload.items) && payload.items.length
    ? payload.items
    : [{ equipmentId: payload.equipmentId, quantity: payload.quantity || 1 }];
  const itemMap = new Map();
  for (const item of requestedItems) {
    const equipmentId = String(item.equipmentId || "");
    const quantity = Number(item.quantity || 1);
    if (!equipmentId || !Number.isFinite(quantity) || quantity < 1) {
      return NextResponse.json({ message: "Select valid equipment and quantity for every product" }, { status: 400 });
    }
    itemMap.set(equipmentId, (itemMap.get(equipmentId) || 0) + quantity);
  }
  const itemEntries = [];
  for (const [equipmentId, quantity] of itemMap) {
    const equipment = await Equipment.findById(equipmentId).lean();
    if (!equipment) {
      return NextResponse.json({ message: "One or more equipment items were not found" }, { status: 404 });
    }
    const availableStock = getAvailableStock(equipment);
    const equipmentName = getEquipmentName(equipment);
    if (availableStock < quantity) {
      return NextResponse.json({ message: `Only ${availableStock} available for ${equipmentName}` }, { status: 409 });
    }
    itemEntries.push({ equipment, quantity });
  }

  if (!borrower || !itemEntries.length) {
    return NextResponse.json({ message: "Borrower or equipment not found" }, { status: 404 });
  }

  const count = await Transaction.countDocuments();
  const code = payload.code || `TR-${String(count + 1).padStart(5, "0")}`;
  const transaction = await Transaction.create({
    equipment: itemEntries[0].equipment._id,
    equipmentId: itemEntries[0].equipment._id,
    items: itemEntries.map(({ equipment, quantity }) => ({ equipment: equipment._id, equipmentId: equipment._id, quantity })),
    borrower: borrower._id,
    borrowerId: borrower._id,
    code,
    transactionId: code,
    quantity: itemEntries[0].quantity,
    status: "active",
    notes: payload.notes || payload.remarks || "",
    dateOut: payload.dateOut || new Date(),
    transactionDate: payload.dateOut || new Date(),
    issuedBy: payload.issuedBy || authUser.name,
  });

  for (const { equipment, quantity } of itemEntries) {
    const nextAvailableStock = getAvailableStock(equipment) - quantity;
    await Equipment.findByIdAndUpdate(equipment._id, {
      availableStock: nextAvailableStock,
      availableQuantity: nextAvailableStock,
      status: nextAvailableStock > 0 ? "Available" : "Rented",
    });
  }

  await ActivityLog.create({
    action: `Issued ${itemEntries.map(({ equipment }) => getEquipmentName(equipment)).join(", ")} to ${borrower.name}`,
    actor: authUser.name,
    entityType: "transaction",
    entityId: transaction.code,
  });

  const populated = await Transaction.findById(transaction._id).populate("borrower").populate("equipment").lean();
  return NextResponse.json(cleanTransaction(populated), { status: 201 });
}
