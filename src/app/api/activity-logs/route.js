import { NextResponse } from "next/server";
import connectMongoDB from "@/server/lib/mongodb";
import ActivityLog from "@/server/models/ActivityLog";

export async function GET() {
  await connectMongoDB();
  const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(10).lean();
  return NextResponse.json(
    logs.map((log) => ({
      id: log._id.toString(),
      action: log.action,
      actor: log.actor,
      createdAt: log.createdAt,
    })),
  );
}
