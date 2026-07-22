import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import ActivityLog from "@/server/models/ActivityLog";
import Equipment from "@/server/models/Equipment";
import Transaction from "@/server/models/Transaction";
import { getAuthUser } from "@/server/lib/auth";

function cleanEquipment(equipment) {
  const totalStock = Number(equipment.totalStock ?? equipment.quantity ?? 1);
  const availableStock = Number(equipment.availableQuantity ?? equipment.availableStock ?? 0);
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

async function findEquipment(id) {
  return Equipment.findOne({ $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : undefined }, { code: id }, { inventoryCode: id }] });
}

export async function GET(_request, { params }) {
  await connectMongoDB();
  const { id } = await params;
  const equipment = await findEquipment(id).lean();
  if (!equipment) {
    return NextResponse.json({ message: "Equipment not found" }, { status: 404 });
  }
  return NextResponse.json(cleanEquipment(equipment));
}

export async function PATCH(request, { params }) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  const { id } = await params;
  const payload = await request.json();
  const equipment = await findEquipment(id);
  if (!equipment) {
    return NextResponse.json({ message: "Equipment not found" }, { status: 404 });
  }

  const totalStock = Number(payload.totalStock ?? payload.quantity ?? equipment.totalStock ?? 1);
  const availableStock = Number(payload.availableStock ?? equipment.availableStock ?? totalStock);
  equipment.name = payload.name || payload.equipmentName || equipment.name;
  equipment.code = payload.code || payload.inventoryCode || equipment.code;
  equipment.category = payload.category || "";
  equipment.totalStock = totalStock;
  equipment.quantity = totalStock;
  equipment.availableStock = Math.min(availableStock, totalStock);
  equipment.availableQuantity = equipment.availableStock;
  equipment.description = payload.description || "";
  equipment.image = payload.image || "";
  equipment.model = payload.model || "";
  equipment.serialNumber = payload.serialNumber || "";
  equipment.condition = payload.condition || "Good";
  equipment.status = payload.status || (equipment.availableStock > 0 ? "Available" : "Rented");
  equipment.location = payload.location || "";
  equipment.donationDate = payload.donationDate || undefined;
  equipment.donorName = payload.donorName || "";
  await equipment.save();

  await ActivityLog.create({
    action: `Updated equipment ${equipment.code}`,
    actor: authUser.name,
    entityType: "equipment",
    entityId: equipment.code,
  });

  return NextResponse.json(cleanEquipment(equipment));
}

export async function DELETE(_request, { params }) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  const { id } = await params;
  const equipment = await findEquipment(id);
  if (!equipment) {
    return NextResponse.json({ message: "Equipment not found" }, { status: 404 });
  }
  const activeTransaction = await Transaction.findOne({
    $or: [{ equipment: equipment._id }, { equipmentId: equipment._id }],
    status: { $in: ["active", "Active"] },
  });
  if (activeTransaction) {
    return NextResponse.json({ message: "Cannot delete equipment with active transactions" }, { status: 409 });
  }
  await equipment.deleteOne();
  await ActivityLog.create({
    action: `Deleted equipment ${equipment.code}`,
    actor: authUser.name,
    entityType: "equipment",
    entityId: equipment.code,
  });
  return NextResponse.json({ ok: true });
}
