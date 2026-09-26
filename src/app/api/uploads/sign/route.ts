import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import { requirePermission } from "@/lib/require-permission";
import { cloudinary } from "@/lib/cloudinary";

const UPLOAD_FOLDER = "mistydoces/produtos";

export async function POST() {
  try {
    await requirePermission("products:edit");

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: UPLOAD_FOLDER },
      process.env.CLOUDINARY_API_SECRET ?? "",
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder: UPLOAD_FOLDER,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    const status = error instanceof AppError ? error.httpStatus : 500;
    const message = error instanceof AppError ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status });
  }
}
