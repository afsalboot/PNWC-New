import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/server/lib/auth";
import { uploadConfig } from "@/server/lib/upload";

export const runtime = "nodejs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function fileToDataUri(file) {
  const bytes = Buffer.from(await file.arrayBuffer());
  return `data:${file.type};base64,${bytes.toString("base64")}`;
}

export async function POST(request) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ message: "Login required" }, { status: 401 });
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return NextResponse.json({ message: "Cloudinary environment variables are missing" }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get(uploadConfig.imageField);
  const folder = formData.get("folder") || "pnwc";

  if (!file || typeof file === "string") {
    return NextResponse.json({ message: "Image file is required" }, { status: 400 });
  }

  const maxBytes = uploadConfig.maxImageSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return NextResponse.json({ message: `Image must be ${uploadConfig.maxImageSizeMb}MB or smaller` }, { status: 413 });
  }

  const result = await cloudinary.uploader.upload(await fileToDataUri(file), {
    folder: `pnwc/${folder}`,
    resource_type: "image",
  });

  return NextResponse.json({ url: result.secure_url, publicId: result.public_id });
}
