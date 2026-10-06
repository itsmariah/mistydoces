import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AppError, UnauthorizedError } from "@/lib/errors";
import { requirePermission } from "@/lib/require-permission";
import { cloudinary } from "@/lib/cloudinary";
import { AVATAR_FOLDER } from "@/lib/avatar";

const PRODUCT_FOLDER = "mistydoces/produtos";

/**
 * Assina um upload direto do navegador para o Cloudinary. A pasta é decidida aqui, não
 * pelo navegador: foto de produto exige permissão de edição; foto de perfil, só login.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const isAvatar = body?.target === "avatar";
    if (isAvatar) {
      const session = await auth();
      if (!session?.user) throw new UnauthorizedError();
    } else {
      await requirePermission("products:edit");
    }
    const folder = isAvatar ? AVATAR_FOLDER : PRODUCT_FOLDER;

    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Upload indisponível: as credenciais do Cloudinary não estão configuradas no .env." },
        { status: 503 },
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET ?? "",
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (error) {
    const status = error instanceof AppError ? error.httpStatus : 500;
    const message = error instanceof AppError ? error.message : "Erro inesperado.";
    return NextResponse.json({ error: message }, { status });
  }
}
