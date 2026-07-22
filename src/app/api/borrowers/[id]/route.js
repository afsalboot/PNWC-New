import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import ActivityLog from "@/server/models/ActivityLog";
import Borrower from "@/server/models/Borrower";
import Transaction from "@/server/models/Transaction";
import { getAuthUser } from "@/server/lib/auth";

function buildAddress(borrower) {
  return borrower.address || [borrower.addressLine1, borrower.addressLine2, borrower.city, borrower.state, borrower.pincode]
    .filter(Boolean)
    .join(", ");
}

function cleanBorrower(borrower) {
  const code = borrower.code || borrower.borrowerId || borrower.customerId;
  return {
    id: borrower._id.toString(),
    code,
    borrowerId: code,
    name: borrower.name,
    phone: borrower.phone,
    alternatePhone: borrower.alternatePhone,
    address: buildAddress(borrower),
    addressLine1: borrower.addressLine1,
    addressLine2: borrower.addressLine2,
    city: borrower.city,
    state: borrower.state,
    pincode: borrower.pincode,
    ward: borrower.ward,
    medicalReason: borrower.medicalReason,
    emergencyContact: borrower.emergencyContact,
    notes: borrower.notes,
    createdAt: borrower.createdAt,
  };
}

function cleanRental(transaction) {
  const itemRows = transaction.items?.length ? transaction.items : [{ equipment: transaction.equipment || transaction.equipmentId, quantity: transaction.quantity || 1 }];
  const returnedByEquipment = new Map();
  for (const event of transaction.returnEvents || []) {
    for (const item of event.items || []) {
      const key = String(item.equipmentId);
      returnedByEquipment.set(key, (returnedByEquipment.get(key) || 0) + Number(item.quantity || 0));
    }
  }
  const products = itemRows.map((item) => {
    const equipment = item.equipment || item.equipmentId || {};
    const quantity = Number(item.quantity || 1);
    const returned = returnedByEquipment.get(String(equipment._id)) || 0;
    return {
      equipmentId: equipment._id?.toString(),
      equipmentName: equipment.name || equipment.equipmentName || equipment.productName || "Equipment",
      inventoryCode: equipment.code || equipment.inventoryCode || "",
      quantity,
      returnedQuantity: returned,
      remainingQuantity: Math.max(0, quantity - returned),
    };
  });
  return {
    id: transaction._id.toString(),
    transactionId: transaction.code || transaction.transactionId,
    issued: transaction.dateOut || transaction.transactionDate,
    status: transaction.status,
    products,
    returnEvents: (transaction.returnEvents || []).map((event) => ({
      date: event.returnDate,
      receivedBy: event.receivedBy,
      items: event.items,
    })),
  };
}

function findBorrower(id) {
  return Borrower.findOne({ $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : undefined }, { code: id }, { borrowerId: id }] });
}

export async function GET(_request, { params }) {
  await connectMongoDB();
  const { id } = await params;
  const borrower = await findBorrower(id).lean();
  if (!borrower) {
    return NextResponse.json({ message: "Borrower not found" }, { status: 404 });
  }
  const transactions = await Transaction.find({ $or: [{ borrower: borrower._id }, { borrowerId: borrower._id }] })
    .populate("equipment")
    .populate("equipmentId")
    .populate("items.equipment")
    .populate("items.equipmentId")
    .sort({ createdAt: -1 })
    .lean();
  const rentals = transactions.map(cleanRental);
  const totalProducts = rentals.reduce((sum, rental) => sum + rental.products.reduce((productSum, product) => productSum + product.quantity, 0), 0);
  const activeProducts = rentals.reduce((sum, rental) => sum + rental.products.reduce((productSum, product) => productSum + product.remainingQuantity, 0), 0);
  return NextResponse.json({
    ...cleanBorrower(borrower),
    rentalSummary: {
      totalTransactions: rentals.length,
      totalProducts,
      activeProducts,
      returnedProducts: totalProducts - activeProducts,
      activeTransactions: rentals.filter((rental) => rental.status.toLowerCase() !== "returned").length,
    },
    rentals,
  });
}

export async function PATCH(request, { params }) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  const { id } = await params;
  const payload = await request.json();
  const borrower = await findBorrower(id);
  if (!borrower) {
    return NextResponse.json({ message: "Borrower not found" }, { status: 404 });
  }
  const code = payload.code || payload.borrowerId || borrower.code || borrower.borrowerId;
  const addressLine1 = payload.addressLine1 || payload.address || "";
  const addressLine2 = payload.addressLine2 || "";
  borrower.name = payload.name || borrower.name;
  borrower.code = code;
  borrower.borrowerId = code;
  borrower.phone = payload.phone || borrower.phone;
  borrower.alternatePhone = payload.alternatePhone || "";
  borrower.addressLine1 = addressLine1;
  borrower.addressLine2 = addressLine2;
  borrower.city = payload.city || "";
  borrower.state = payload.state || "";
  borrower.pincode = payload.pincode || "";
  borrower.address = payload.address || [addressLine1, addressLine2, payload.city, payload.state, payload.pincode].filter(Boolean).join(", ");
  borrower.ward = payload.ward || "";
  borrower.medicalReason = payload.medicalReason || "";
  borrower.emergencyContact = payload.emergencyContact || "";
  borrower.notes = payload.notes || "";
  await borrower.save();

  await ActivityLog.create({
    action: `Updated borrower ${borrower.name}`,
    actor: authUser.name,
    entityType: "borrower",
    entityId: borrower.code,
  });

  return NextResponse.json(cleanBorrower(borrower));
}

export async function DELETE(_request, { params }) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  const { id } = await params;
  const borrower = await findBorrower(id);
  if (!borrower) {
    return NextResponse.json({ message: "Borrower not found" }, { status: 404 });
  }
  const activeTransaction = await Transaction.findOne({
    $or: [{ borrower: borrower._id }, { borrowerId: borrower._id }],
    status: { $in: ["active", "Active"] },
  });
  if (activeTransaction) {
    return NextResponse.json({ message: "Cannot delete borrower with active transactions" }, { status: 409 });
  }
  await borrower.deleteOne();
  await ActivityLog.create({
    action: `Deleted borrower ${borrower.name}`,
    actor: authUser.name,
    entityType: "borrower",
    entityId: borrower.code,
  });
  return NextResponse.json({ ok: true });
}
