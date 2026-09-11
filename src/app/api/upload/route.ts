import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;

    // 1. Signed Cloudinary Upload (if API key & secret provided)
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      const uploadResponse = await cloudinary.uploader.upload(base64Image, {
        folder: "coach_coke_store",
      });
      return NextResponse.json({ url: uploadResponse.secure_url });
    } 
    // 2. Unsigned Cloudinary Upload (if upload preset provided)
    else if (uploadPreset) {
      const uploadResponse = await cloudinary.uploader.unsigned_upload(base64Image, uploadPreset, {
        folder: "coach_coke_store",
      });
      return NextResponse.json({ url: uploadResponse.secure_url });
    } 
    // 3. Fallback Preview mode
    else {
      return NextResponse.json({
        url: base64Image,
        message: "Uploaded locally as Data URL. Add Cloudinary credentials or upload preset in Vercel environment variables.",
      });
    }
  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "Failed to process image upload" }, { status: 500 });
  }
}
