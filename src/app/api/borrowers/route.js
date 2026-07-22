import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import Borrower from "@/server/models/Borrower";
import ActivityLog from "@/server/models/ActivityLog";
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

export async function GET() {
  await connectMongoDB();
  const borrowers = await Borrower.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(borrowers.map(cleanBorrower));
}

export async function POST(request) {
  await connectMongoDB();
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }
  const payload = await request.json();
  const count = await Borrower.countDocuments();
  const code = payload.code || payload.borrowerId || `BR-${String(count + 1).padStart(6, "0")}`;
  const existingBorrower = await Borrower.findOne({
    $or: [
      { code },
      { borrowerId: code },
      ...(payload.phone ? [{ phone: payload.phone }] : []),
    ],
  }).lean();

  if (existingBorrower) {
    return NextResponse.json(cleanBorrower(existingBorrower));
  }

  const addressLine1 = payload.addressLine1 || payload.address || "";
  const addressLine2 = payload.addressLine2 || "";
  const address = payload.address || [addressLine1, addressLine2, payload.city, payload.state, payload.pincode]
    .filter(Boolean)
    .join(", ");
  let borrower;
  try {
    borrower = await Borrower.create({
      name: payload.name,
      code,
      borrowerId: code,
      phone: payload.phone,
      address,
      addressLine1,
      addressLine2,
      city: payload.city || "",
      state: payload.state || "",
      pincode: payload.pincode || "",
      notes: payload.notes || "",
    });
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateValue = error.keyValue?.borrowerId || error.keyValue?.code || error.keyValue?.phone || code;
      const duplicateBorrower = await Borrower.findOne({
        $or: [{ code: duplicateValue }, { borrowerId: duplicateValue }, { phone: duplicateValue }],
      }).lean();
      if (duplicateBorrower) {
        return NextResponse.json(cleanBorrower(duplicateBorrower));
      }
      return NextResponse.json({ message: `Borrower ${duplicateValue} already exists` }, { status: 409 });
    }
    throw error;
  }
  await ActivityLog.create({
    action: `Added borrower ${borrower.name}`,
    actor: authUser.name,
    entityType: "borrower",
    entityId: borrower.code,
  });
  return NextResponse.json(cleanBorrower(borrower), { status: 201 });
}
