import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import Borrower from "@/server/models/Borrower";
import Equipment from "@/server/models/Equipment";
import Transaction from "@/server/models/Transaction";
import User from "@/server/models/User";

export async function GET() {
  await connectMongoDB();
  const [
    totalEquipment,
    availableEquipment,
    rentedEquipment,
    maintenanceEquipment,
    totalBorrowers,
    activeTransactions,
    returnedEquipment,
    totalVolunteers,
  ] = await Promise.all([
    Equipment.countDocuments(),
    Equipment.countDocuments({ status: "Available" }),
    Equipment.countDocuments({ status: "Rented" }),
    Equipment.countDocuments({ status: "Maintenance" }),
    Borrower.countDocuments(),
    Transaction.countDocuments({ status: { $in: ["active", "Active"] } }),
    Transaction.countDocuments({ status: { $in: ["returned", "Returned"] } }),
    User.countDocuments({ role: "volunteer" }),
  ]);

  return NextResponse.json({
    totalEquipment,
    availableEquipment,
    rentedEquipment,
    maintenanceEquipment,
    totalBorrowers,
    activeTransactions,
    returnedEquipment,
    totalVolunteers,
  });
}
