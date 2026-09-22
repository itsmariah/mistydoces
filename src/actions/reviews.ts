"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { UnauthorizedError, toActionError } from "@/lib/errors";
import * as reviewService from "@/services/review-service";
import { reviewSchema } from "@/validations/review";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export async function createReview(
  productSlug: string,
  productId: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      },
    };
  }

  try {
    const session = await auth();
    if (!session?.user) throw new UnauthorizedError();

    await reviewService.createReview(session.user.id, productId, parsed.data);
    revalidatePath(`/cardapio/${productSlug}`);
    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: toActionError(error) };
  }
}
