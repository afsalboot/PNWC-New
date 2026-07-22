import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import Equipment from "@/server/models/Equipment";
import ActivityLog from "@/server/models/ActivityLog";
import { generateInventoryCode } from "@/server/utils/inventoryCode";
import { getAuthUser } from "@/server/lib/auth";

function getAvailableStock(equipment) {
  return Number(equipment.availableQuantity ?? equipment.availableStock ?? 0);
}

function getTotalStock(equipment) {
  return Number(equipment.totalStock ?? equipment.quantity ?? 1);
}

function cleanEquipment(equipment) {
  const availableStock = getAvailableStock(equipment);
  const totalStock = getTotalStock(equipment);
  return {
    id: equipment._id.toString(),
    code: equipment.code || equipment.inventoryCode,
    name: equipment.name || equipment.equipmentName || equipment.productName,
    inventoryCode: equipment.code || equipment.inventoryCode,
    equipmentName: equipment.name || equipment.equipmentName || equipment.productName,
    category: equipment.category,
    model: equipment.model,
    serialNumber: equipment.serialNumber,
    totalStock,
    availableStock,
    availableQuantity: availableStock,
    quantity: totalStock,
    availableQuantity: availableStock,
    rentedQuantity: Math.max(totalStock - availableStock, 0),
    condition: equipment.condition,
    status: equipment.status || (availableStock > 0 ? "Available" : "Rented"),
    location: equipment.location,
    description: equipment.description,
    image: equipment.image,
    donationDate: equipment.donationDate,
    donorName: equipment.donorName,
    createdAt: equipment.createdAt,
  };
}

export async function GET() {
  await connectMongoDB();
  const equipment = await Equipment.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(equipment.map(cleanEquipment));
}

export async function POST(request) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  const payload = await request.json();
  const count = await Equipment.countDocuments();
  const totalStock = Number(payload.totalStock || payload.quantity || 1);
  const availableStock = Number(payload.availableStock ?? (payload.status === "Available" ? totalStock : 0));
  const code = payload.code || payload.inventoryCode || generateInventoryCode(count + 1);
  const equipment = await Equipment.create({
    name: payload.name || payload.equipmentName,
    code,
    category: payload.category || "",
    totalStock,
    quantity: totalStock,
    availableStock,
    availableQuantity: availableStock,
    description: payload.description || "",
    image: payload.image || "",
    model: payload.model || "",
    serialNumber: payload.serialNumber || "",
    condition: payload.condition || "Good",
    status: availableStock > 0 ? "Available" : "Rented",
    location: payload.location || "",
    donationDate: payload.donationDate || undefined,
    donorName: payload.donorName || "",
  });
  await ActivityLog.create({
    action: `Added equipment ${equipment.code}`,
    actor: authUser.name,
    entityType: "equipment",
    entityId: equipment.code,
  });
  return NextResponse.json(cleanEquipment(equipment), { status: 201 });
}
